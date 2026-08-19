/**
 * lib/menu-revamp.ts
 *
 * The Revamp scorecard: an uploaded restaurant menu (PDF or photo) in, a scored
 * analysis out. Powers POST /api/revamp/analyze.
 *
 * The rubric is the same eight moves the /revamp and /tips-and-tricks pages
 * describe, so a restaurant reads the page and then gets scored against exactly
 * what it just read. `id`s are stable machine keys; `name`s match the site copy.
 *
 * Structured output comes from a forced strict tool call rather than "reply with
 * JSON" + prose-stripping: `strict: true` guarantees the input validates against
 * the schema, so there is no parsing to get wrong.
 */
import Anthropic, { toFile } from "@anthropic-ai/sdk";

/** Override to trade cost for depth without a deploy. */
export const MODEL = process.env.REVAMP_MODEL ?? "claude-opus-5";

/** Weights sum to 100 — `overall_score` is their weighted average. */
export const MOVES = [
  { id: "taste_led_language", name: "Focus on tasty titles", weight: 15 },
  { id: "integration_not_segregation", name: "Do NOT separate the menu", weight: 15 },
  { id: "prominent_positioning", name: "Be proud and plant-based", weight: 12 },
  { id: "plant_default", name: "Make meats add-ons", weight: 14 },
  { id: "fair_or_better_pricing", name: "Price plant-based dishes fairly", weight: 12 },
  { id: "plenty_of_options", name: "Have lots of options", weight: 14 },
  { id: "blended_and_substituted", name: "Save money on the meat", weight: 9 },
  { id: "appetising_framing", name: "Make plant-rich eating feel abundant", weight: 9 },
] as const;

export const MOVE_IDS = MOVES.map((m) => m.id);

export const SYSTEM_PROMPT = `You are the menu analyst for "Revamp", Ahead of the Menu's service that helps restaurants and cafés rework their menus so more diners choose plant-rich dishes — without removing a single choice. Your tone is a warm, food-loving consultant who also understands restaurant economics. Never preachy. Always say "plant-based" or "plant-rich"; never "vegan" or "vegetarian" in your recommendations.

You will be given a restaurant or café menu as a PDF or photo. Read it carefully, identify the dishes, and score it against the eight moves below. Base EVERY finding on what is actually on the menu, quoting real item names and prices. If the image is unreadable or is not a food menu, set the "error" field and leave the rest at their defaults.

THE EIGHT MOVES (each scored 0-100), with weights:

1. taste_led_language — "Focus on tasty titles" (weight 15). Dishes named for flavour, texture and provenance ("Smoky maple-glazed", "Slow-roasted", "Charred") rather than health or restriction. Penalise clinical words — "vegan", "vegetarian", "meat-free", "healthy", "diet". Reward specific, mouth-watering descriptions. Appetising names lift ordering 25-108%.

2. integration_not_segregation — "Do NOT separate the menu" (weight 15). Plant-rich dishes sit beside comparable animal dishes inside each course, NOT quarantined in a "Vegan/Veggie" section. Penalise a separate section, and penalise diet-first framing where the label leads instead of the food. Integrating them instead of sectioning them off raised how often diners picked them by ~7 percentage points (Bacon & Krpan, 2018, Appetite). This is the single most common and most costly mistake — weight your finding accordingly.

IMPORTANT — do NOT recommend removing dietary markers. Plant-based and allergy-aware guests need to identify what they can eat, and in many places allergen information is a legal requirement. A small (V)/(VG)/leaf marker sitting quietly at the END of a dish line, or a key at the foot of the menu, is good practice and should NOT be penalised. What costs orders is a marker that DOMINATES: a symbol before the dish name, a diet word standing in for an appetising description, a colour-coded block, or a legend that turns the page into a dietary chart. Score this move on placement and prominence, never on the existence of the marker. If markers are already discreet, say so and score it well.

3. prominent_positioning — "Be proud and plant-based" (weight 12). Plant-rich options appear first in their section, as chef's specials, "our favourite", boxed, or otherwise visually prominent. Reward plant dishes given the best real estate; penalise burying them at the bottom.

4. plant_default — "Make meats add-ons" (weight 14). The default build of a dish is plant-based with animal ingredients as a paid opt-in ("add chicken +$3"). Reward reverse-default framing; penalise the plant version being framed as the substitute. Reverse defaults have flipped ordering from ~9% to 80%.

5. fair_or_better_pricing — "Price plant-based dishes fairly" (weight 12). Equivalent plant dishes cost the same or LESS than animal versions, and there is no surcharge for oat/soy milk. Penalise plant-milk surcharges and plant dishes priced above their meat equivalents — a premium measurably discourages plant-based orders.

6. plenty_of_options — "Have lots of options" (weight 14). A real share of the menu is plant-based across EVERY course — starters, mains, sides, desserts, drinks. Compute the approximate plant-based share. Reward ~40%+ with good spread; penalise tokenism (one lonely veggie dish).

7. blended_and_substituted — "Save money on the meat" (weight 9). Where animal products are used, the menu leans on blended meats (mushroom-beef "protein flip" patties at 25-30%) and substitutes (aquafaba, plant milks, legumes) to cut the animal share and the cost per plate. Reward any blending or substitution; name specific dishes that could be blended.

8. appetising_framing — "Make plant-rich eating feel abundant" (weight 9). Overall the menu makes plant-rich eating feel generous and indulgent — hero descriptions, tempting sides, plant-forward specials — rather than a compromise.

SCORING:
- overall_score = the weighted average of the eight scores, 0-100, rounded.
- grade: A (85-100), B (70-84), C (55-69), D (40-54), F (below 40).
- status per move: "good" (70+), "partial" (40-69), "poor" (below 40).

Where a fix also SAVES the restaurant money (cheaper plant proteins, blended patties, less spoilage), say so — operators act on margin faster than on ethics.

LENGTH LIMITS — stay well within these:
- summary: at most 3 sentences.
- Each finding: ONE sentence.
- At most 2 examples per move, and only where the menu clearly warrants it (0-1 is fine).
- Each excerpt is a short quote, not a whole section. Each issue and suggestion is one short sentence.
- Exactly 3-4 top_recommendations, ordered by impact.
Use the menu's own currency symbols as they appear.`;

const EXAMPLE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["excerpt", "issue", "suggestion"],
  properties: {
    excerpt: { type: "string", description: "A short exact quote from the menu." },
    issue: { type: "string", description: "One short sentence on why it holds diners back." },
    suggestion: { type: "string", description: "One short sentence: a concrete rewrite or fix." },
  },
} as const;

export const SCORECARD_TOOL: Anthropic.Beta.BetaTool = {
  name: "save_menu_scorecard",
  description:
    "Return the scored analysis of the provided menu. Call this exactly once, filling " +
    "every one of the eight criteria keys.",
  // NOT strict. This schema is past what strict mode will compile ("the compiled
  // grammar is too large"), and strict also refuses array bounds outright
  // (minItems > 1 and maxItems are both rejected). So the schema steers the model
  // and `normaliseScorecard` below does the enforcing — every field the UI reads
  // is coerced, defaulted, and clamped there rather than trusted.
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: ["error", "overall_score", "grade", "summary", "menu_stats", "criteria", "top_recommendations"],
    properties: {
      error: {
        type: ["string", "null"],
        description:
          "Null on success. A short explanation when the file is unreadable or is not a food menu — " +
          "in that case the remaining fields may be zeroed/empty.",
      },
      overall_score: { type: "integer", description: "Weighted average of the eight scores, 0-100." },
      grade: { enum: ["A", "B", "C", "D", "F"] },
      summary: {
        type: "string",
        description: "2-3 warm, specific sentences on the biggest strength and biggest opportunity.",
      },
      menu_stats: {
        type: "object",
        additionalProperties: false,
        required: ["total_dishes", "plant_based_dishes", "plant_based_share_pct"],
        properties: {
          total_dishes: { type: "integer" },
          plant_based_dishes: { type: "integer" },
          plant_based_share_pct: { type: "integer" },
        },
      },
      criteria: {
        type: "object",
        // An OBJECT keyed by move id, not an array.
        //
        // Strict mode rejects `minItems` above 1 ("values other than 0 or 1 are
        // not supported"), so an array could not express "exactly eight" — and
        // without that, the model legitimately returned 2 of the 8 moves and the
        // UI rendered a near-empty breakdown. `required` on eight named keys is
        // the one shape strict mode DOES enforce, so every move must be scored.
        // The route flattens this back into an ordered array for the client.
        additionalProperties: false,
        required: [...MOVE_IDS],
        description: "One entry for every move. All eight keys are mandatory.",
        properties: MOVES.reduce(
          (acc, m) => {
            acc[m.id] = {
              type: "object",
              additionalProperties: false,
              required: ["score", "status", "finding", "examples"],
              description: `${m.name} (weight ${m.weight}).`,
              properties: {
                score: { type: "integer", description: "0-100." },
                status: { enum: ["good", "partial", "poor"] },
                finding: { type: "string", description: "ONE sentence citing real menu items." },
                examples: { type: "array", items: EXAMPLE_SCHEMA, description: "0-2 entries." },
              },
            };
            return acc;
          },
          {} as Record<string, unknown>
        ),
      },
      top_recommendations: {
        type: "array",
        // Strict mode supports NEITHER minItems(>1) NOR maxItems on arrays, so
        // array length can't be expressed here at all. The prompt asks for 3-4
        // and the code below clamps the upper bound.
        description: "3-4 entries, ordered by impact.",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["title", "why", "example", "impact"],
          properties: {
            title: { type: "string", description: "A punchy action." },
            why: { type: "string", description: "One sentence on the expected effect, grounded in this menu." },
            example: { type: "string", description: "One sentence: Before -> After, using a real item." },
            impact: { enum: ["high", "medium", "low"] },
          },
        },
      },
    },
  },
};

export type ScorecardExample = { excerpt: string; issue: string; suggestion: string };
export type ScorecardCriterion = {
  id: string;
  name: string;
  score: number;
  weight: number;
  status: "good" | "partial" | "poor";
  finding: string;
  examples: ScorecardExample[];
};

/** What the model actually returns for `criteria`: keyed by move id. */
type RawCriteria = Record<
  string,
  { score: number; status: "good" | "partial" | "poor"; finding: string; examples: ScorecardExample[] }
>;

/**
 * Flattens the keyed criteria into the ordered array the UI renders, re-attaching
 * the display name and weight from MOVES so those stay owned by us rather than
 * by whatever the model echoed back.
 */
const clampScore = (n: unknown): number =>
  Math.max(0, Math.min(100, Math.round(Number(n)) || 0));

const asStatus = (v: unknown, score: number): ScorecardCriterion["status"] =>
  v === "good" || v === "partial" || v === "poor" ? v : score >= 70 ? "good" : score >= 40 ? "partial" : "poor";

/**
 * Everything strict mode would have guaranteed, done by hand.
 *
 * The UI reads these fields directly, so a missing `criteria` key or a score of
 * "eighty" must not reach it. Anything absent is dropped rather than rendered as
 * undefined; anything out of range is clamped.
 */
function normaliseScorecard(raw: Omit<Scorecard, "criteria"> & { criteria: RawCriteria }): Scorecard {
  const stats = raw.menu_stats ?? ({} as Scorecard["menu_stats"]);
  return {
    error: raw.error ?? null,
    overall_score: clampScore(raw.overall_score),
    grade: (["A", "B", "C", "D", "F"] as const).includes(raw.grade) ? raw.grade : "F",
    summary: typeof raw.summary === "string" ? raw.summary : "",
    menu_stats: {
      total_dishes: Number(stats.total_dishes) || 0,
      plant_based_dishes: Number(stats.plant_based_dishes) || 0,
      plant_based_share_pct: Number(stats.plant_based_share_pct) || 0,
    },
    criteria: orderCriteria(raw.criteria ?? {}),
    top_recommendations: (Array.isArray(raw.top_recommendations) ? raw.top_recommendations : [])
      .filter((r) => r && typeof r.title === "string")
      .slice(0, 4),
  };
}

function orderCriteria(raw: RawCriteria): ScorecardCriterion[] {
  return MOVES.filter((m) => raw?.[m.id]).map((m) => {
    const c = raw[m.id];
    const score = clampScore(c.score);
    return {
      id: m.id,
      name: m.name,
      weight: m.weight,
      score,
      status: asStatus(c.status, score),
      finding: typeof c.finding === "string" ? c.finding : "",
      examples: (Array.isArray(c.examples) ? c.examples : [])
        .filter((e) => e && typeof e.excerpt === "string")
        .slice(0, 2),
    };
  });
}
export type Scorecard = {
  error: string | null;
  overall_score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  summary: string;
  menu_stats: { total_dishes: number; plant_based_dishes: number; plant_based_share_pct: number };
  criteria: ScorecardCriterion[];
  top_recommendations: Array<{ title: string; why: string; example: string; impact: "high" | "medium" | "low" }>;
};

/** Thrown when the upload itself is the problem — surfaced to the user as 4xx. */
export class MenuInputError extends Error {}

/**
 * Thrown when the menu is legible but too long to analyse in one pass. Distinct
 * from MenuInputError because the fix is different: the user should send fewer
 * pages, not a different file.
 */
export class MenuTooLargeError extends Error {}

export const ACCEPTED_MEDIA: Record<string, "document" | "image"> = {
  "application/pdf": "document",
  "image/jpeg": "image",
  "image/png": "image",
  "image/webp": "image",
  "image/gif": "image",
};

/**
 * Sniffs the real type from magic bytes rather than trusting the browser's
 * Content-Type, which is client-controlled. Returns null for anything we can't
 * positively identify.
 */
export function sniffMediaType(bytes: Uint8Array): string | null {
  const b = bytes;
  if (b.length >= 5 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46 && b[4] === 0x2d) {
    return "application/pdf"; // %PDF-
  }
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b.length >= 6 && b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38) return "image/gif";
  if (
    b.length >= 12 &&
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
  ) {
    return "image/webp"; // RIFF....WEBP
  }
  return null;
}

/**
 * Above this we upload via the Files API instead of inlining base64.
 *
 * Inline content is capped by Anthropic's 32MB whole-request limit, and base64
 * inflates bytes by ~33% — so a 25MB PDF would serialise to ~33MB and be
 * rejected. The Files API takes the raw file (500MB ceiling) and, as a bonus,
 * returns an id we could reuse across follow-up calls instead of re-sending the
 * document each time.
 */
const INLINE_MAX_BYTES = 3 * 1024 * 1024;

const FILES_BETA = "files-api-2025-04-14";

/**
 * Hard ceiling on pages we'll accept.
 *
 * Measured against the real tokenizer with this system prompt and tool schema, a
 * page costs ~2,060 input tokens — so 40 pages is ~85k tokens (~$0.63 all-in on
 * Opus 5). The number bounds COST, not capability: a 300-page PDF is ~620k
 * tokens, which still fits the 1M context window and would bill ~$3.30 without
 * erroring. On an endpoint with no login and no quota, that silent-success case
 * is exactly the one to refuse.
 */
export const MAX_PAGES = 40;

/**
 * Page count for a PDF.
 *
 * Parses with pdf-lib rather than scanning bytes for `/Type /Page`. That naive
 * scan works only on uncompressed PDFs — anything written with object streams
 * (Word, InDesign, and pdf-lib's own output) hides those markers inside
 * compressed streams, so the scan silently returns null and the page cap would
 * never fire on exactly the modern files most likely to be huge.
 *
 * Falls back to the byte scan if pdf-lib can't parse the file, and returns null
 * if neither works — callers treat null as "unknown", not as "zero".
 */
export async function countPdfPages(bytes: Uint8Array): Promise<number | null> {
  try {
    const { PDFDocument } = await import("pdf-lib");
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    return doc.getPageCount();
  } catch {
    // Fall through to the cheap scan — better than nothing on a file pdf-lib
    // refuses (some encrypted or subtly malformed documents).
  }

  const text = Buffer.from(bytes).toString("latin1");
  let declared = 0;
  const countRe = /\/Count\s+(\d+)/g;
  for (let m = countRe.exec(text); m !== null; m = countRe.exec(text)) {
    declared = Math.max(declared, Number(m[1]));
  }
  const scanned = (text.match(/\/Type\s*\/Page[^s]/g) ?? []).length;
  const best = Math.max(declared, scanned);
  return best > 0 ? best : null;
}

/**
 * Runs the analysis. Streams because a menu-sized vision request with adaptive
 * thinking can outrun the SDK's non-streaming HTTP timeout.
 */
export async function analyseMenu(
  bytes: Uint8Array
): Promise<{ scorecard: Scorecard; usage: unknown; model: string }> {
  // Validate the caller's input BEFORE our own configuration: someone uploading a
  // .docx should be told the file type is wrong whether or not our key is set.
  const mediaType = sniffMediaType(bytes);
  if (!mediaType || !ACCEPTED_MEDIA[mediaType]) {
    throw new MenuInputError("Unsupported file type. Please upload a PDF, JPG, PNG, or WEBP.");
  }

  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not set on the server");

  const isDoc = ACCEPTED_MEDIA[mediaType] === "document";

  // Refuse oversized documents BEFORE the upload and the model call — this is the
  // only thing standing between an open endpoint and a multi-dollar request.
  if (isDoc) {
    const pages = await countPdfPages(bytes);
    if (pages !== null && pages > MAX_PAGES) {
      throw new MenuTooLargeError(
        `That PDF is ${pages} pages — we analyse up to ${MAX_PAGES} at a time. Please upload just the food pages.`
      );
    }
  }

  const client = new Anthropic();

  // Large files go up once via the Files API and are referenced by id; small
  // ones ride inline, which saves a round trip.
  let uploadedFileId: string | null = null;
  let source: Anthropic.Beta.BetaContentBlockParam;
  if (bytes.length > INLINE_MAX_BYTES) {
    const uploaded = await client.beta.files.upload({
      file: await toFile(Buffer.from(bytes), `menu.${isDoc ? "pdf" : mediaType.split("/")[1]}`, {
        type: mediaType,
      }),
      betas: [FILES_BETA],
    });
    uploadedFileId = uploaded.id;
    source = isDoc
      ? { type: "document", source: { type: "file", file_id: uploaded.id } }
      : { type: "image", source: { type: "file", file_id: uploaded.id } };
  } else {
    const data = Buffer.from(bytes).toString("base64");
    source = isDoc
      ? { type: "document", source: { type: "base64", media_type: "application/pdf", data } }
      : { type: "image", source: { type: "base64", media_type: mediaType as "image/jpeg", data } };
  }

  let message: Anthropic.Beta.BetaMessage;
  try {
    const stream = client.beta.messages.stream({
      model: MODEL,
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      thinking: { type: "adaptive" },
      tools: [SCORECARD_TOOL],
      tool_choice: { type: "tool", name: SCORECARD_TOOL.name },
      betas: [FILES_BETA],
      messages: [
        {
          role: "user",
          content: [
            source,
            {
              type: "text",
              text: "Analyse this menu and call save_menu_scorecard with the full scorecard.",
            },
          ],
        },
      ],
    });
    message = await stream.finalMessage();
  } finally {
    // Files persist at Anthropic until deleted, and we never reuse this one —
    // so drop it whether the analysis succeeded or threw.
    if (uploadedFileId) {
      await client.beta.files
        .delete(uploadedFileId, { betas: [FILES_BETA] })
        .catch((err) => console.error("revamp: could not delete uploaded file:", (err as Error).message));
    }
  }

  // With a FORCED tool call, hitting the token cap doesn't give a partial
  // scorecard — it gives an unusable half-serialised tool call. Fail loudly
  // rather than let `toolUse.input` come back missing half its fields.
  if (message.stop_reason === "max_tokens") {
    throw new MenuTooLargeError(
      "That menu is too long for one pass. Try uploading just the food pages, or one section at a time."
    );
  }
  if (message.stop_reason === "refusal") {
    throw new MenuInputError("We couldn't analyse that file. Please upload an actual food menu.");
  }

  const toolUse = message.content.find(
    (b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use" && b.name === SCORECARD_TOOL.name
  );
  if (!toolUse) throw new Error("The model returned no scorecard");

  const raw = toolUse.input as Omit<Scorecard, "criteria"> & { criteria: RawCriteria };
  if (raw.error) throw new MenuInputError(raw.error);

  return { scorecard: normaliseScorecard(raw), usage: message.usage, model: MODEL };
}
