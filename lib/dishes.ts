import { sanitizeVideoEmbeds } from "./video-embeds";

export const CUISINES = ["american","italian","mexican","indian","chinese","thai","japanese","korean","vietnamese","mediterranean","middle-eastern","french","ethiopian","other"] as const;
export const DISH_TYPES = ["main","side","appetizer","breakfast","soup","salad","dessert","snack","drink","sauce","other"] as const;
export const ALLERGENS = ["gluten","nuts","peanuts","soy","dairy","eggs","sesame","shellfish","fish","coconut"] as const;
export const UNITS = ["mg","g","kg","ml","l","fl_oz","tsp","tbsp","cup","pt","qt","gallon","oz","lb","stick","mm","cm","inch","piece","clove","can","pinch","dash","splash","cube","handful","bunch","sprig","to_taste","other"] as const;
export const TRIED_BY = ["just_me","friends","family","strangers","a_lot"] as const;
export const TRIED_BY_LABELS: Record<(typeof TRIED_BY)[number], string> = {
  just_me: "Just me", friends: "Friends", family: "Family", strangers: "Strangers", a_lot: "A lot of people",
};
export const TAGS = ["fast", "easy", "cheap", "expensive", "fancy", "healthy", "high-protein", "comfort-food", "spicy", "kid-friendly", "bulk-prep", "low-effort", "raw", "raw-vegan"] as const;

const MAX_SHORT = 200, MAX_LONG = 4000, MAX_NAME = 120, MAX_EMAIL = 254, MAX_TAGS = 25, MAX_INGREDIENTS = 100, MAX_STEPS = 60;
const MAX_ALTS_PER_INGREDIENT = 6, MAX_ALT_LINES = 12;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https?:\/\/[^\s]+$/i;

function str(v: unknown, max: number): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim().replace(/\s+/g, " ");
  return t === "" ? undefined : t.slice(0, max);
}
function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

// Ingredient quantities stay flexible so a cook can write an amount the way a recipe
// prints it — a fraction ("2/3") or mixed number ("1 1/2") — WITHOUT the lossy decimal
// conversion (2/3 => 0.666…). Intake only accepts a value that PARSES to a finite number
// (see parseQuantity). Storage rule:
//   • a plain whole/decimal number → stored as a NUMBER (unchanged legacy behavior)
//   • a fraction / mixed number / unicode fraction → stored VERBATIM as a string
//   • empty or anything that can't be parsed to a float → null
// Every reader already String()-formats the value, so a mixed number|string column is safe.
const PLAIN_NUM_RE = /^(?:\d+(?:\.\d+)?|\.\d+)$/;
const UNICODE_FRACTIONS: Record<string, number> = {
  "¼": 1 / 4, "½": 1 / 2, "¾": 3 / 4,
  "⅐": 1 / 7, "⅑": 1 / 9, "⅒": 1 / 10,
  "⅓": 1 / 3, "⅔": 2 / 3,
  "⅕": 1 / 5, "⅖": 2 / 5, "⅗": 3 / 5, "⅘": 4 / 5,
  "⅙": 1 / 6, "⅚": 5 / 6,
  "⅛": 1 / 8, "⅜": 3 / 8, "⅝": 5 / 8, "⅞": 7 / 8,
};
const UNICODE_FRACTION_RE = /[¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]/;

/** Parse a typed quantity into a finite number, or null when it isn't a single sensible
 *  amount. Handles integers, decimals, ascii fractions ("2/3"), mixed numbers ("1 1/2"),
 *  and unicode fractions ("½", "1½"). Used to validate intake and to scale recipes later. */
export function parseQuantity(s: string): number | null {
  const t = s.trim().replace(/\s+/g, " ");
  if (t === "" || t.length > 40) return null;

  // Unicode fraction, optionally with a leading whole number ("1½", "1 ½", "½").
  const uni = t.match(UNICODE_FRACTION_RE);
  if (uni) {
    if (t.slice(uni.index! + 1).trim() !== "") return null; // nothing may follow the fraction
    const frac = UNICODE_FRACTIONS[uni[0]];
    const whole = t.slice(0, uni.index).trim();
    if (whole === "") return frac;
    return PLAIN_NUM_RE.test(whole) ? Number(whole) + frac : null;
  }

  // ascii fraction or mixed number: "a/b" or "w a/b".
  const m = t.match(/^(?:(\d+)\s+)?(\d+)\s*\/\s*(\d+)$/);
  if (m) {
    const den = Number(m[3]);
    if (den === 0) return null;
    return (m[1] ? Number(m[1]) : 0) + Number(m[2]) / den;
  }

  // Plain integer / decimal.
  return PLAIN_NUM_RE.test(t) ? Number(t) : null;
}

/** True when `s` is a quantity that converts to a valid float — a number, decimal,
 *  fraction, mixed number, or unicode fraction. Empty is valid (quantity is optional). */
export function isValidQuantity(s: string): boolean {
  return s.trim() === "" || parseQuantity(s) !== null;
}

/** Coerce a raw quantity into its stored form: a number for plain numbers, the verbatim
 *  string for fractions/unicode, null for empty or anything that can't be parsed. */
function qtyValue(v: unknown): number | string | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v !== "string") return null;
  const t = v.trim().replace(/\s+/g, " ");
  if (t === "") return null;
  if (PLAIN_NUM_RE.test(t)) return Number(t);
  return parseQuantity(t) !== null ? t : null;
}
function strArray(v: unknown, max: number, cap: number): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => str(x, cap)).filter((x): x is string => !!x).slice(0, max);
}

// One sanitized ingredient line: { id?, name, quantity, unit }. Shared by top-level
// ingredient rows AND alternative lines, so both get identical name/quantity/unit/id
// coercion. Returns null for a nameless row (the caller drops it).
type IngredientLine = { id?: string; name: string; quantity: number | string | null; unit: string; nestedDishId?: number | string };
function ingredientLine(r: any): IngredientLine | null {
  const name = str(r?.name, MAX_NAME);
  if (!name) return null;
  const row: IngredientLine = { name, quantity: qtyValue(r?.quantity), unit: str(r?.unit, 40) ?? "" };
  const id = str(r?.id, MAX_NAME); if (id) row.id = id;
  // Optional link to another dish used as an ingredient ("nested recipe"). Kept only
  // when present so a plain ingredient serializes byte-identically to the legacy shape.
  if (r?.nestedDishId != null && r.nestedDishId !== "") row.nestedDishId = r.nestedDishId;
  return row;
}

export type DishData = Record<string, unknown>;

export function buildDishData(input: any): DishData {
  const title = str(input?.title, MAX_SHORT);
  if (!title) throw new Error("Recipe title is required");

  const d: DishData = { title };
  const desc = str(input?.description, MAX_LONG); if (desc) d.description = desc;
  // cuisine / dishType / unit / allergens are intentionally NOT clamped to the allowed
  // sets: the UI offers those lists plus an "Other → free text" escape, so any capped
  // string is accepted here. Moderators can normalize on promotion to `recipes`.
  const cuisines = strArray(input?.cuisines, CUISINES.length, MAX_SHORT); if (cuisines.length) d.cuisines = cuisines;
  const dishType = strArray(input?.dishType, DISH_TYPES.length, MAX_SHORT); if (dishType.length) d.dishType = dishType;

  const tags = strArray(input?.tags, MAX_TAGS, MAX_SHORT); if (tags.length) d.tags = tags;

  const rawIng = Array.isArray(input?.ingredients) ? input.ingredients : [];
  const ingredients = rawIng
    .map((r: any) => {
      const row: any = ingredientLine(r);
      if (!row) return null;

      // Optional ingredient `section` for multi-part recipes (e.g. "Batter", "Sauce").
      // Omitted when empty so a sectionless row serializes byte-identically to the
      // legacy shape — existing dishes are unaffected (no migration needed).
      const section = str(r?.section, MAX_SHORT);
      if (section) row.section = section;

      // Optional per-ingredient note ("finely diced", "room temperature").
      const ingNote = str(r?.note, MAX_SHORT);
      if (ingNote) row.note = ingNote;

      // Optional-ingredient flag — marks a skippable ingredient (a garnish, an
      // add-in, "to taste"). Drives the recipe's "possible allergens" tier and
      // renders as "(optional)" on the dish page. Omitted when false (back-compat).
      if (r?.optional === true) row.optional = true;

      // Optional `alternatives` — substitutions for THIS ingredient. Each alternative
      // is a group of one-or-more lines (a swap can be several ingredients, e.g.
      // 1 egg => 1 tbsp flax + 3 tbsp water) with an optional label + free-text note.
      // Alternatives stay NESTED on the row — never hoisted into the flat list — so the
      // "use Y instead of X" relationship survives. Omitted when empty (backwards-compat).
      const rawAlts = Array.isArray(r?.alternatives) ? r.alternatives : [];
      const alternatives = rawAlts
        .map((a: any) => {
          const items = (Array.isArray(a?.items) ? a.items : [])
            .map(ingredientLine)
            .filter(Boolean)
            .slice(0, MAX_ALT_LINES);
          if (!items.length) return null; // drop alternatives with no usable lines
          const alt: any = { items };
          const label = str(a?.label, MAX_SHORT); if (label) alt.label = label;
          const note = str(a?.note, MAX_LONG); if (note) alt.note = note;
          return alt;
        })
        .filter(Boolean)
        .slice(0, MAX_ALTS_PER_INGREDIENT);
      if (alternatives.length) row.alternatives = alternatives;

      return row;
    })
    .filter(Boolean)
    .slice(0, MAX_INGREDIENTS);
  if (ingredients.length) d.ingredients = ingredients;

  const steps = strArray(input?.steps, MAX_STEPS, MAX_LONG); if (steps.length) d.steps = steps;

  const specialProducts = strArray(input?.specialProducts, 50, MAX_SHORT); if (specialProducts.length) d.specialProducts = specialProducts;
  const specialEquipment = str(input?.specialEquipment, MAX_LONG); if (specialEquipment) d.specialEquipment = specialEquipment;
  const originalCreator = str(input?.originalCreator, MAX_SHORT); if (originalCreator) d.originalCreator = originalCreator;
  const notes = str(input?.notes, MAX_LONG); if (notes) d.notes = notes;

  const allergens = strArray(input?.allergens, 30, MAX_SHORT); if (allergens.length) d.allergens = allergens;

  // "May contain" allergens — a second tier for brand/optional-ingredient-dependent
  // allergens (e.g. nuts only if you add the optional almonds). Enum-filtered and
  // deduped against the definite list (definite wins). Rides in dish_data (no migration).
  const possibleAllergens = strArray(input?.possibleAllergens, 30, MAX_SHORT)
    .filter((a) => (ALLERGENS as readonly string[]).includes(a))
    .filter((a) => !allergens.includes(a));
  if (possibleAllergens.length) d.possibleAllergens = possibleAllergens;

  const resourceLink = str(input?.resourceLink, MAX_SHORT);
  if (resourceLink) { if (!URL_RE.test(resourceLink)) throw new Error("Resource link must be a valid URL"); d.resourceLink = resourceLink; }

  // Embedded YouTube/TikTok links — re-parsed to a canonical { platform, id, url }
  // so stored data can never reference an arbitrary embed source.
  const videoEmbeds = sanitizeVideoEmbeds(input?.videoEmbeds);
  if (videoEmbeds.length) d.videoEmbeds = videoEmbeds;

  // Cover image URL (uploaded to storage by the form; rendered by dish cards).
  const image = str(input?.image, MAX_SHORT);
  if (image) { if (!URL_RE.test(image)) throw new Error("Cover image must be a valid URL"); d.image = image; }

  if (input?.cost != null && input.cost !== "") {
    const cost = num(input.cost);
    if (cost === null || cost < 0) throw new Error("Cost must be a non-negative number");
    d.cost = cost;
  }

  if (input?.servings != null && input.servings !== "") {
    const servings = num(input.servings);
    if (servings === null || servings < 0) throw new Error("Servings must be a non-negative number");
    d.servings = servings;
  }
  // Effort on a 1–3 scale — the dish card's three "Effort" dots. Optional input that
  // defaults to 2 (the middle) when unset; an out-of-range or non-integer value is rejected.
  let difficulty = 2;
  if (input?.difficulty != null && input.difficulty !== "") {
    const eff = num(typeof input.difficulty === "string" ? Number(input.difficulty) : input.difficulty);
    if (eff === null || !Number.isInteger(eff) || eff < 1 || eff > 3) throw new Error("Effort must be an integer from 1 to 3");
    difficulty = eff;
  }
  d.difficulty = difficulty;

  const prepTime = str(input?.prepTime, MAX_SHORT); if (prepTime) d.prepTime = prepTime;
  const cookTime = str(input?.cookTime, MAX_SHORT); if (cookTime) d.cookTime = cookTime;

  const sbName = str(input?.submittedBy?.name, MAX_NAME);
  const sbEmail = str(input?.submittedBy?.email, MAX_EMAIL);
  if (sbEmail && !EMAIL_RE.test(sbEmail)) throw new Error("Invalid email");
  if (sbName || sbEmail) { d.submittedBy = {}; if (sbName) (d.submittedBy as any).name = sbName; if (sbEmail) (d.submittedBy as any).email = sbEmail; }

  const v: any = {};
  const triedBy = strArray(input?.validation?.triedBy, TRIED_BY.length, 40)
    .filter((t) => (TRIED_BY as readonly string[]).includes(t));
  if (triedBy.length) v.triedBy = triedBy;
  const feedback = str(input?.validation?.feedback, MAX_LONG); if (feedback) v.feedback = feedback;
  if (input?.validation?.reviewCount != null && input.validation.reviewCount !== "") {
    const rc = num(input.validation.reviewCount);
    if (rc === null || rc < 0 || !Number.isInteger(rc)) throw new Error("Review count must be a non-negative integer");
    v.reviewCount = rc;
  }
  // Rating on a selectable scale (out of 5 / 10 / 100). Stored with its scale so it stays meaningful.
  let ratingScale: number | null = null;
  if (input?.validation?.ratingScale != null && input.validation.ratingScale !== "") {
    const rs = num(input.validation.ratingScale);
    if (rs === null || rs <= 0) throw new Error("Rating scale must be a positive number");
    ratingScale = rs;
  }
  if (input?.validation?.rating != null && input.validation.rating !== "") {
    const scale = ratingScale ?? 5;
    const rt = num(input.validation.rating);
    if (rt === null || rt < 0 || rt > scale) throw new Error(`Rating must be between 0 and ${scale}`);
    v.rating = rt;
    v.ratingScale = scale;
  }
  if (Object.keys(v).length) d.validation = v;

  return d;
}
