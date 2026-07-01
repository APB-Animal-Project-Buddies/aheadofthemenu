// Recipe extraction: turn an uploaded recipe document (PDF / docx / image / text)
// into our intake-form shape via Claude's forced tool call.
//
// SOURCE OF TRUTH for the prompt + tool schema. Used by:
//   - app/api/dishes/parse/route.ts  (the upload endpoint)
//   - scripts/extract-recipe/run.ts  (local spike/debug runner)
//
// Division of labor:
//  - The LLM does LANGUAGE: decompose ingredient lines into name/quantity/unit,
//    split prose into discrete steps, bin into our enums, INFER allergens /
//    specialty products / prohibitive equipment from the ingredients.
//  - The LLM does NOT do IDENTITY: it never assigns an ingredient `id`. Names are
//    resolved against /api/ingredients/search downstream.
//  - Output is a human-confirmed DRAFT that prefills the form — not authoritative.
//
// One recipe per call. Bulk documents are out of scope (and would extract poorly).

import { inflateRawSync } from "node:zlib";
import { CUISINES, DISH_TYPES, ALLERGENS, UNITS } from "./dishes";
import { BRAND_HINTS, RARE_HINTS, PLANT_BASED_BRANDS, RARE_EXPENSIVE_INGREDIENTS } from "./special-products";

// Cheap + fast is plenty for this; flip via env to compare.
export const MODEL = process.env.RECIPE_EXTRACT_MODEL ?? "claude-haiku-4-5";

// Brand / rare-ingredient lists live in lib/special-products.ts (pure data, shared
// with the client form). Re-exported for the spike runner's existing imports.
export { PLANT_BASED_BRANDS, RARE_EXPENSIVE_INGREDIENTS };

// ---------------------------------------------------------------------------
// The tool call (strict structured output). One tool, forced via tool_choice.
// Every top-level key maps to a RecipeFormValues field; ingredients[].raw /
// .preparation are audit aids (the form binds name + quantity + unit).
// ---------------------------------------------------------------------------
export const EXTRACT_TOOL = {
  name: "save_extracted_recipe",
  description:
    "Return the structured recipe parsed from the provided document, shaped to " +
    "prefill our recipe submission form. Call this exactly once. Use null / empty " +
    "arrays for transcription fields the document does not state — never guess those.",
  strict: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: [
      "title",
      "description",
      "cuisines",
      "dishType",
      "tags",
      "ingredients",
      "steps",
      "specialProducts",
      "specialEquipment",
      "allergens",
      "resourceLink",
      "originalCreator",
      "notes",
      "servings",
      "prepTime",
    ],
    properties: {
      title: {
        type: ["string", "null"],
        description: "The dish name. Null if the document has no clear title.",
      },
      description: {
        type: ["string", "null"],
        description:
          "A short blurb describing the dish, if the document provides one. Do not synthesize one from the steps.",
      },
      cuisines: {
        type: "array",
        description:
          "One or more cuisines from the allowed list that describe the dish — fusion dishes can have several " +
          "(e.g. a Korean-Mexican taco => ['korean','mexican']). Usually one. Empty array if genuinely unclear. " +
          "Use 'other' only when it's clearly a cuisine we don't list.",
        items: { enum: [...CUISINES] },
      },
      dishType: {
        type: "array",
        description:
          "One or more dish types from the allowed list (a dish can be both, e.g. ['soup','main']). " +
          "Empty array if unclear.",
        items: { enum: [...DISH_TYPES] },
      },
      tags: {
        type: "array",
        description:
          "Short freeform tags describing the dish (e.g. 'bulk-prep', 'fast-service', 'spicy', 'one-pot'). " +
          "Infer a few useful ones from the recipe; empty array if nothing obvious.",
        items: { type: "string" },
      },
      ingredients: {
        type: "array",
        description:
          "One entry per ingredient line, in document order. Break each line into a clean name, a numeric " +
          "quantity, and a unit from the allowed list. Empty array if no ingredient list is present.",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["name", "quantity", "unit", "section", "alternatives", "preparation", "raw"],
          properties: {
            name: {
              type: "string",
              description:
                "The ingredient itself, prep words removed, suitable for matching our ingredient pool. " +
                "e.g. '2 cloves garlic, minced' => 'garlic'. Only attach a brand when the source explicitly " +
                "names it — do not infer a brand onto a generic ingredient.",
            },
            quantity: {
              type: ["number", "null"],
              description:
                "Numeric amount. Convert fractions and unicode to decimals (½ => 0.5, '1 1/2' => 1.5). " +
                "For a range ('2-3') use the lower bound. Null if no amount is given ('salt to taste'). " +
                "If a metric conversion is in parentheses ('1 lb (450g)'), use the value matching the chosen unit.",
            },
            unit: {
              enum: [...UNITS, null],
              description:
                "Best-fit unit from the allowed list. Map close synonyms (tablespoon=>tbsp, gram=>g). " +
                "Prefer a specific listed unit over 'other' ('a handful' => 'handful', 'salt to taste' => " +
                "quantity null + unit 'to_taste', '3 eggs' => quantity 3 + unit 'piece'). Use 'other' only for a " +
                "genuinely unlistable unit, and null when there is simply no unit at all.",
            },
            section: {
              type: ["string", "null"],
              description:
                "The recipe part this ingredient belongs to, when the source splits ingredients into groups " +
                "('For the batter:', 'Sauce:', 'Topping'). Use that exact header text. Null when the recipe is a " +
                "single flat ingredient list with no sub-sections.",
            },
            alternatives: {
              type: "array",
              description:
                "Substitutions the SOURCE states for this ingredient ('or use X', 'sub: Y + Z', 'gluten-free: …'). " +
                "Transcription only — never invent a swap. Each alternative is a group of one or more replacement " +
                "lines (a swap can be multiple ingredients, e.g. 1 egg => 1 tbsp flax + 3 tbsp water). Empty array " +
                "when the source states no substitution for this ingredient.",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["label", "note", "items"],
                properties: {
                  label: {
                    type: ["string", "null"],
                    description: "Short name for the swap ('Flax egg', 'Gluten-free'). Null if the source gives none.",
                  },
                  note: {
                    type: ["string", "null"],
                    description:
                      "Any qualifier the source attaches to the swap ('for a firmer bite', 'if nut-free', " +
                      "'not gluten-free'). Null if none.",
                  },
                  items: {
                    type: "array",
                    description: "One or more replacement lines, each split into name / quantity / unit like a normal ingredient.",
                    items: {
                      type: "object",
                      additionalProperties: false,
                      required: ["name", "quantity", "unit"],
                      properties: {
                        name: { type: "string", description: "Replacement ingredient name, prep words removed." },
                        quantity: { type: ["number", "null"], description: "Numeric amount, same rules as a normal line. Null if none." },
                        unit: { enum: [...UNITS, null], description: "Best-fit unit from the allowed list, same rules as a normal line." },
                      },
                    },
                  },
                },
              },
            },
            preparation: {
              type: ["string", "null"],
              description:
                "Prep/qualifier stripped from the name: 'minced', 'finely chopped', 'divided', 'to taste'. Null if none.",
            },
            raw: {
              type: "string",
              description: "The original ingredient line VERBATIM, for auditing the parse.",
            },
          },
        },
      },
      steps: {
        type: "array",
        description:
          "The method broken into discrete, ordered steps. Split run-on instructions ('heat oil, add garlic, " +
          "then stir in sauce') into separate steps; order = array order. Empty array if no method is present.",
        items: { type: "string" },
      },
      specialProducts: {
        type: "array",
        description:
          "Array of specialty / hard-to-source items this recipe needs — one entry per item, brand intact. " +
          "STRICT focus: (1) branded plant-based products by name (scan every ingredient line) and (2) rare / " +
          "expensive / not-normally-stocked ingredients (no brand needed). " +
          `Brands to watch for: ${BRAND_HINTS}. Rare/expensive: ${RARE_HINTS}. ` +
          "e.g. ['Beyond Meat', 'Better Than Bouillon', 'saffron']. Empty array if the recipe uses none.",
        items: { type: "string" },
      },
      specialEquipment: {
        type: ["string", "null"],
        description:
          "A readable list of equipment NOT every kitchen owns and that could be prohibitive " +
          "(suribachi, sous vide immersion circulator, pressure canner, tortilla press, dehydrator). " +
          "Never list common items (knife, pot, pan, bowl, whisk, oven). Null if nothing notable is required.",
      },
      allergens: {
        type: "array",
        description:
          "Allergens present, INFERRED from the ingredients — populate even when the document lists none. " +
          "Map everything into THIS allowed set: wheat/flour => gluten; tree nuts => nuts; crustaceans/molluscs " +
          "=> shellfish; soy sauce/miso/tofu => soy; tahini => sesame; anchovy/fish sauce => fish; " +
          "milk/butter/cheese => dairy. Plant-based meats are usually pea/soy/bean-based and gluten-free; do not " +
          "infer gluten from a sausage/burger/grounds unless wheat, seitan, vital wheat gluten, breadcrumbs, soy " +
          "sauce, or flour is actually present. Be reasonably inclusive, but never flag an allergen with no " +
          "supporting ingredient. Empty array only if the ingredients genuinely contain none.",
        items: { enum: [...ALLERGENS] },
      },
      resourceLink: {
        type: ["string", "null"],
        description: "A source/recipe URL if the document contains one. Null otherwise.",
      },
      originalCreator: {
        type: ["string", "null"],
        description: "Author/source/attribution if the document names one. Null otherwise.",
      },
      notes: {
        type: ["string", "null"],
        description: "Tips, substitutions, or storage notes the document includes. Null if none.",
      },
      servings: {
        type: ["number", "null"],
        description:
          "How many servings/portions the recipe yields, as a number (e.g. 'Serves 4' => 4, " +
          "'makes 12 muffins' => 12). For a range ('4-6') use the lower bound. Null if not stated.",
      },
      prepTime: {
        type: ["string", "null"],
        description:
          "The time the recipe states, kept as readable text (e.g. '30 min', '1 hr 20 min', " +
          "'45 min active + 5 hr chill'). Prefer total time if given. Null if not stated.",
      },
    },
  },
} as const;

export const SYSTEM_PROMPT = `You extract structured recipe data from documents that are completely non-standardized — scanned PDFs, blog exports, handwritten cards, restaurant sheets. Layout, ordering, and completeness vary wildly. Your output prefills a recipe submission form, so it must map cleanly onto its fields.

Most fields are faithful TRANSCRIPTION — only record what the document states, never invent a title, ingredient, step, or quantity:
- Break the ingredient list down: one entry per ingredient, each split into a clean name, a numeric quantity, and a unit from the allowed list (this mirrors the form's name / qty / unit row).
- If the recipe splits its ingredients into labeled parts ("For the batter:", "Sauce:"), set each ingredient's section to that header; leave section null for a single flat list.
- If the source states a substitution for an ingredient ("or use X", "sub Y + Z", "gluten-free: …"), capture it under that ingredient's alternatives — one alternative per stated swap, each a group of one or more replacement lines (a swap can be several ingredients). Put any qualifier on the swap into the alternative's note. Never invent a substitution; empty array when none is stated.
- Break the method down into discrete, ordered steps — split run-on instructions into separate actions.
- Bin cuisine, dishType, and unit into the provided allowed lists; use null rather than forcing a wrong bin.
- Only attach a brand name to an ingredient when the source explicitly states it; never infer a brand onto a generic ingredient.
- Do NOT assign ingredient IDs or match a database — that happens downstream.

Three fields are deliberate INFERENCE from the ingredient list, not transcription — populate them even when the document never spells them out, but stay grounded in the actual ingredients (never fabricate one with nothing behind it):
- allergens: derive the allergens implied by the ingredients, mapped into the form's allowed allergen set (wheat => gluten, miso/soy sauce => soy, tahini => sesame, parmesan => dairy, crustaceans => shellfish). Remember plant-based meats are usually gluten-free.
- specialProducts: flag (1) BRANDED plant-based products by name (Juicy Marbles, Chunk Foods, Miyoko's, Daiya, Oshi, Beyond, Impossible, Gardein, plus specialty staples like nutritional yeast/aquafaba/seitan), and (2) RARE / EXPENSIVE / hard-to-find ingredients prohibitive on cost or availability (saffron, truffles, cardamom, matsutake). Both are a strict focus.
- specialEquipment: flag tools not every kitchen owns and that could be prohibitive (suribachi, sous vide circulator, pressure canner) — never common items like a knife, pan, or oven.

Return your result by calling save_extracted_recipe exactly once.`;

export const USER_INSTRUCTION =
  "Extract the recipe from the attached document. Call save_extracted_recipe with everything you can parse.";

// ---------------------------------------------------------------------------
// DOCX → text, dependency-free (no `unzip` binary — works in a serverless route).
// A .docx is a ZIP; the body lives in word/document.xml. We read the ZIP central
// directory, inflate that one entry, then strip the XML to plain text.
// ---------------------------------------------------------------------------
export function docxToText(bytes: Uint8Array): string {
  const buf = Buffer.from(bytes);
  // End Of Central Directory record: signature 0x06054b50, search from the tail.
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("File is not a valid .docx (no ZIP directory found)");

  const cdOffset = buf.readUInt32LE(eocd + 16);
  const cdCount = buf.readUInt16LE(eocd + 10);
  let p = cdOffset;
  for (let n = 0; n < cdCount; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) break; // central-directory file header
    const method = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const localOffset = buf.readUInt32LE(p + 42);
    const name = buf.toString("utf8", p + 46, p + 46 + nameLen);
    if (name === "word/document.xml") {
      if (buf.readUInt32LE(localOffset) !== 0x04034b50) throw new Error("Corrupt .docx (bad local header)");
      const lhNameLen = buf.readUInt16LE(localOffset + 26);
      const lhExtraLen = buf.readUInt16LE(localOffset + 28);
      const dataStart = localOffset + 30 + lhNameLen + lhExtraLen;
      const data = buf.subarray(dataStart, dataStart + compSize);
      const xml = (method === 0 ? data : inflateRawSync(data)).toString("utf8");
      return xmlToText(xml);
    }
    p += 46 + nameLen + extraLen + commentLen;
  }
  throw new Error("Could not find word/document.xml in the .docx");
}

function xmlToText(xml: string): string {
  return xml
    .replace(/<\/w:p>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

// ---------------------------------------------------------------------------
// Core: file/text in → form-shaped draft out. One recipe per call.
// ---------------------------------------------------------------------------
const IMAGE_MIME: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif",
};

export type ExtractInput = {
  filename?: string;
  mediaType?: string;
  bytes?: Uint8Array; // binary (pdf/docx/image)
  text?: string;      // already-extracted plain text
};

export async function extractRecipeDraft(input: ExtractInput): Promise<{ draft: any; usage: any; model: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set on the server");

  const name = (input.filename ?? "").toLowerCase();
  const mt = (input.mediaType ?? "").toLowerCase();
  const ext = name.includes(".") ? name.split(".").pop()! : "";
  const hint = input.filename
    ? `Document filename (may hint at title/cuisine): ${input.filename}\n\n`
    : "";
  const b64 = (b: Uint8Array) => Buffer.from(b).toString("base64");
  const asText = (t: string) => `${USER_INSTRUCTION}\n\n${hint}---\n${t}`;

  let content: any;
  if (input.text != null) {
    content = asText(input.text);
  } else if (!input.bytes) {
    throw new Error("No file content provided");
  } else if (mt === "application/pdf" || ext === "pdf") {
    content = [
      { type: "text", text: `${USER_INSTRUCTION}\n\n${hint}` },
      { type: "document", source: { type: "base64", media_type: "application/pdf", data: b64(input.bytes) } },
    ];
  } else if (ext === "docx" || mt.includes("officedocument.wordprocessing")) {
    content = asText(docxToText(input.bytes));
  } else if (IMAGE_MIME[ext] || mt.startsWith("image/")) {
    content = [
      { type: "text", text: `${USER_INSTRUCTION}\n\n${hint}` },
      { type: "image", source: { type: "base64", media_type: IMAGE_MIME[ext] ?? mt, data: b64(input.bytes) } },
    ];
  } else if (mt.startsWith("text/") || ["txt", "md", "rtf", "csv"].includes(ext)) {
    content = asText(Buffer.from(input.bytes).toString("utf8"));
  } else {
    throw new Error(`Unsupported file type: ${input.filename ?? input.mediaType ?? "unknown"}`);
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      tools: [EXTRACT_TOOL],
      tool_choice: { type: "tool", name: EXTRACT_TOOL.name },
      messages: [{ role: "user", content }],
    }),
  });
  if (!res.ok) throw new Error(`Claude API ${res.status}: ${await res.text()}`);

  const json: any = await res.json();
  const toolUse = json.content?.find((b: any) => b.type === "tool_use" && b.name === EXTRACT_TOOL.name);
  if (!toolUse) throw new Error("No extraction returned by the model");
  return { draft: toolUse.input, usage: json.usage, model: MODEL };
}
