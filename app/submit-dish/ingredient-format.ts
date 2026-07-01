// Read stored dish_data back into the intake form's shape (the inverse of the
// form's flatten-on-submit). Handles BOTH stored ingredient formats:
//   V1 (legacy): { id?, name, quantity, unit }              — no section/alternatives
//   V2 (current): V1 + { section?, alternatives?[] }
// Tolerant of nulls/garbage: bad rows are skipped, quantities are coerced to the
// strings the form inputs expect.
import {
  RECIPE_FORM_DEFAULTS,
  emptyIngredient,
  type IngredientGroup,
  type Ingredient,
  type Alternative,
  type IngredientLine,
  type RecipeFormValues,
} from "./types";

const qstr = (q: unknown) => (q === null || q === undefined ? "" : String(q));

function toLine(r: any): IngredientLine | null {
  if (!r || typeof r !== "object") return null;
  const name = typeof r.name === "string" ? r.name : "";
  if (!name.trim()) return null;
  const line: IngredientLine = { name, quantity: qstr(r.quantity), unit: typeof r.unit === "string" ? r.unit : "" };
  if (typeof r.id === "string" && r.id) line.id = r.id;
  return line;
}

function toAlternative(a: any): Alternative {
  const items = (Array.isArray(a?.items) ? a.items : []).map(toLine).filter(Boolean) as IngredientLine[];
  return {
    label: typeof a?.label === "string" ? a.label : "",
    note: typeof a?.note === "string" ? a.note : "",
    // an alternative always needs at least one (possibly empty) editable line
    items: items.length ? items : [{ name: "", quantity: "", unit: "" }],
  };
}

/** Flat stored ingredients → grouped form state, grouped by section (first-appearance order). */
export function normalizeStoredIngredients(raw: unknown): IngredientGroup[] {
  const rows = Array.isArray(raw) ? raw : [];
  const groups: IngredientGroup[] = [];
  const bySection = new Map<string, IngredientGroup>();

  for (const r of rows) {
    const line = toLine(r);
    if (!line) continue;
    const section = r && typeof r.section === "string" ? r.section.trim() : "";
    const alternatives: Alternative[] = Array.isArray(r?.alternatives)
      ? r.alternatives.map(toAlternative).filter((a: Alternative) => a.items.some((x) => x.name.trim()) || a.label.trim() || a.note.trim())
      : [];
    const note = r && typeof r.note === "string" ? r.note : "";
    const ingredient: Ingredient = { ...line, note, alternatives };

    let g = bySection.get(section);
    if (!g) {
      g = { section, items: [] };
      bySection.set(section, g);
      groups.push(g);
    }
    g.items.push(ingredient);
  }

  // Nothing usable → the same blank default the create form starts with.
  if (!groups.length) return [{ section: "", items: Array.from({ length: 5 }, emptyIngredient) }];
  return groups;
}

/** Full stored dish_data → form values, for prefilling the form in edit mode. */
export function dishToFormValues(dishData: any): RecipeFormValues {
  const d = dishData || {};
  const v = d.validation || {};
  const arr = (x: unknown) => (Array.isArray(x) ? x : []);
  const num = (x: unknown) => (x === null || x === undefined || x === "" ? "" : String(x));
  return {
    ...RECIPE_FORM_DEFAULTS,
    title: d.title ?? "",
    description: d.description ?? "",
    cuisines: arr(d.cuisines),
    dishType: arr(d.dishType),
    tags: arr(d.tags),
    ingredientGroups: normalizeStoredIngredients(d.ingredients),
    steps: arr(d.steps).length ? arr(d.steps).map((t: string) => ({ text: String(t) })) : RECIPE_FORM_DEFAULTS.steps,
    specialProducts: arr(d.specialProducts),
    specialEquipment: d.specialEquipment ?? "",
    cost: num(d.cost),
    servings: num(d.servings),
    prepTime: d.prepTime ?? "",
    allergens: arr(d.allergens),
    resourceLink: d.resourceLink ?? "",
    originalCreator: d.originalCreator ?? "",
    notes: d.notes ?? "",
    name: d.submittedBy?.name ?? "",
    email: d.submittedBy?.email ?? "",
    triedBy: arr(v.triedBy),
    feedback: v.feedback ?? "",
    reviewCount: num(v.reviewCount),
    rating: num(v.rating),
    ratingScale: v.ratingScale != null ? String(v.ratingScale) : "5",
  };
}
