export const LIKED_OPTIONS = ["taste", "texture", "seasoning", "appearance", "aroma"] as const;
export type LikedOption = (typeof LIKED_OPTIONS)[number];

// Ordinal scale for how a plant-based substitution compares to the non-plant original.
// Centered on "equal" = 0 so the score reads as better(+)/worse(-) than the original.
// "Not applicable" is represented by the ABSENCE of a substitution value (no score).
export const SUBSTITUTION_OPTIONS = [
  { key: "much_worse", label: "Much worse", score: -2 },
  { key: "slightly_worse", label: "Slightly worse", score: -1 },
  { key: "equal", label: "Equal", score: 0 },
  { key: "slightly_better", label: "Slightly better", score: 1 },
  { key: "much_better", label: "Much better", score: 2 },
] as const;
export type SubstitutionKey = (typeof SUBSTITUTION_OPTIONS)[number]["key"];
export const SUBSTITUTION_NA = "na";

// Reviewer's diet — context for weighting reviews later. "other" carries free text.
export const DIET_OPTIONS = [
  { key: "omnivore", label: "Omnivore (plant & animal-based foods)" },
  { key: "vegan", label: "Vegan (plant-based only, no animal products)" },
  { key: "vegetarian", label: "Vegetarian (plant-based except dairy and/or eggs)" },
  { key: "pescetarian", label: "Pescetarian (plants & fish only)" },
] as const;
export type DietKey = (typeof DIET_OPTIONS)[number]["key"];
export const DIET_OTHER = "other";

const MAX_COMMENT = 2000, MAX_NAME = 120, MAX_EMAIL = 254;
const RATING_MIN = 1, RATING_MAX = 10;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ReviewInput = {
  rating: number; expectations: number;
  liked?: unknown; disliked?: unknown; substitution?: unknown; comments?: unknown;
  reviewer?: { name?: unknown; email?: unknown; diet?: unknown; dietOther?: unknown } | null;
};
export type ReviewData = {
  rating: number; expectations: number; liked: LikedOption[]; disliked: LikedOption[];
  substitution?: { key: SubstitutionKey; score: number };
  comments?: string;
  reviewer?: { name?: string; email?: string; diet?: string; dietOther?: string };
};

export function isCommentRequired(rating: number): boolean {
  return rating <= 2 || rating === 10;
}

function int1to10(v: unknown, field: string): number {
  if (typeof v !== "number" || !Number.isInteger(v) || v < RATING_MIN || v > RATING_MAX)
    throw new Error(`${field} must be an integer in ${RATING_MIN}-${RATING_MAX}`);
  return v;
}
function str(v: unknown, max: number): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t === "" ? undefined : t.slice(0, max);
}

export function buildReviewData(input: ReviewInput): ReviewData {
  const rating = int1to10(input.rating, "rating");
  const expectations = int1to10(input.expectations, "expectations");
  const likedRaw = Array.isArray(input.liked) ? input.liked : [];
  const liked = LIKED_OPTIONS.filter((o) => (likedRaw as unknown[]).includes(o));
  const dislikedRaw = Array.isArray(input.disliked) ? input.disliked : [];
  const disliked = LIKED_OPTIONS.filter((o) => (dislikedRaw as unknown[]).includes(o));
  const comments = str(input.comments, MAX_COMMENT);
  if (isCommentRequired(rating) && !comments) throw new Error("A comment is required for this rating");
  const name = str(input.reviewer?.name, MAX_NAME);
  const email = str(input.reviewer?.email, MAX_EMAIL);
  if (email && !EMAIL_RE.test(email)) throw new Error("Invalid email");
  const dietRaw = input.reviewer?.diet;
  const dietKeys = DIET_OPTIONS.map((d) => d.key) as readonly string[];
  const diet =
    typeof dietRaw === "string" && (dietKeys.includes(dietRaw) || dietRaw === DIET_OTHER) ? dietRaw : undefined;
  const dietOther = diet === DIET_OTHER ? str(input.reviewer?.dietOther, MAX_NAME) : undefined;
  const data: ReviewData = { rating, expectations, liked, disliked };
  const sub = SUBSTITUTION_OPTIONS.find((s) => s.key === input.substitution);
  if (sub) data.substitution = { key: sub.key, score: sub.score };
  if (comments) data.comments = comments;
  if (name || email || diet) {
    data.reviewer = {};
    if (name) data.reviewer.name = name;
    if (email) data.reviewer.email = email;
    if (diet) data.reviewer.diet = diet;
    if (dietOther) data.reviewer.dietOther = dietOther;
  }
  return data;
}

const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
const CODE_LEN = 5;

export function randomShortCode(): string {
  let out = "";
  for (let i = 0; i < CODE_LEN; i++) out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return out;
}
export function generateUniqueShortCode(exists: (c: string) => boolean, maxAttempts = 10): string {
  for (let i = 0; i < maxAttempts; i++) {
    const c = randomShortCode();
    if (!exists(c)) return c;
  }
  throw new Error("Could not generate a unique short code");
}

export function isValidShortCode(code: unknown): code is string {
  return typeof code === "string" && /^[a-z0-9]{1,16}$/.test(code);
}
export function parseDishTarget(link: { target_type: string; target_id: string } | null | undefined): number | null {
  if (!link || link.target_type !== "dish_review") return null;
  const id = Number.parseInt(link.target_id, 10);
  return Number.isInteger(id) && String(id) === link.target_id.trim() ? id : null;
}
