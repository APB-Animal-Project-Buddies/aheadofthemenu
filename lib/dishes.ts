export const CUISINES = ["american","italian","mexican","indian","chinese","thai","japanese","korean","vietnamese","mediterranean","middle-eastern","french","ethiopian","other"] as const;
export const DISH_TYPES = ["main","side","appetizer","breakfast","soup","salad","dessert","snack","drink","sauce","other"] as const;
export const ALLERGENS = ["gluten","nuts","peanuts","soy","dairy","eggs","sesame","shellfish","fish","coconut"] as const;
export const UNITS = ["mg","g","kg","ml","l","fl_oz","tsp","tbsp","cup","pt","qt","gallon","oz","lb","stick","mm","cm","inch","piece","clove","can","pinch","dash","splash","cube","handful","bunch","sprig","to_taste","other"] as const;
export const TRIED_BY = ["just_me","friends","family","strangers","a_lot"] as const;
export const TRIED_BY_LABELS: Record<(typeof TRIED_BY)[number], string> = {
  just_me: "Just me", friends: "Friends", family: "Family", strangers: "Strangers", a_lot: "A lot of people",
};
export const TAGS = ["fast","easy","cheap","expensive","fancy","healthy","high-protein","comfort-food","spicy","kid-friendly","bulk-prep","low-effort"] as const;

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
function strArray(v: unknown, max: number, cap: number): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => str(x, cap)).filter((x): x is string => !!x).slice(0, max);
}

// One sanitized ingredient line: { id?, name, quantity, unit }. Shared by top-level
// ingredient rows AND alternative lines, so both get identical name/quantity/unit/id
// coercion. Returns null for a nameless row (the caller drops it).
type IngredientLine = { id?: string; name: string; quantity: number | null; unit: string };
function ingredientLine(r: any): IngredientLine | null {
  const name = str(r?.name, MAX_NAME);
  if (!name) return null;
  const row: IngredientLine = { name, quantity: num(r?.quantity), unit: str(r?.unit, 40) ?? "" };
  const id = str(r?.id, MAX_NAME); if (id) row.id = id;
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

  const resourceLink = str(input?.resourceLink, MAX_SHORT);
  if (resourceLink) { if (!URL_RE.test(resourceLink)) throw new Error("Resource link must be a valid URL"); d.resourceLink = resourceLink; }

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
  const prepTime = str(input?.prepTime, MAX_SHORT); if (prepTime) d.prepTime = prepTime;

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
