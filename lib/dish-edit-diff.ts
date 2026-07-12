/**
 * Diff helpers for the admin edit-proposal review (app/admin/edits). Kept as pure
 * functions so the "which fields changed" logic is unit-testable independently of
 * the React page — a proposal that changes ONLY a field missing from this list
 * would otherwise render as "No field differences" and look like a no-op.
 */

// Top-level dish_data fields surfaced in the diff, in display order.
// NOTE: every user-editable dish_data key must appear here, or a proposal that
// touches only that key will look like it changed nothing.
export const DISH_EDIT_FIELDS: Array<[key: string, label: string]> = [
  ["title", "Title"], ["description", "Description"], ["cuisines", "Cuisines"],
  ["dishType", "Dish type"], ["tags", "Tags"], ["ingredients", "Ingredients"],
  ["steps", "Steps"], ["specialProducts", "Special products"], ["specialEquipment", "Special equipment"],
  ["cost", "Cost"], ["servings", "Servings"], ["prepTime", "Prep time"], ["cookTime", "Cook time"],
  ["allergens", "Allergens"], ["possibleAllergens", "Possible allergens"],
  ["resourceLink", "Resource link"], ["videoEmbeds", "Video links"], ["originalCreator", "Original creator"],
  ["notes", "Notes"], ["image", "Cover image"],
];

/** True when two dish_data field values differ (null-normalized, order-sensitive). */
export function fieldChanged(a: unknown, b: unknown): boolean {
  return JSON.stringify(a ?? null) !== JSON.stringify(b ?? null);
}

/** The [key, label] pairs whose value differs between the current and proposed dish_data. */
export function diffDishFields(current: any, proposed: any): Array<[string, string]> {
  return DISH_EDIT_FIELDS.filter(([k]) => fieldChanged(current?.[k], proposed?.[k]));
}

/** Human-readable rendering of one dish_data field value for the diff view. */
export function formatDishField(key: string, val: unknown): string {
  if (val === undefined || val === null || val === "") return "—";
  if (key === "ingredients") {
    return ((val as any[]) || [])
      .map((i) => {
        const line = [i.quantity, (i.unit || "").replace(/_/g, " "), i.name].filter(Boolean).join(" ");
        const sec = i.section ? `[${i.section}] ` : "";
        const alts = (i.alternatives || []).length ? ` (+${i.alternatives.length} alt)` : "";
        return sec + line + alts;
      })
      .join("\n");
  }
  if (key === "steps") return ((val as any[]) || []).map((s, n) => `${n + 1}. ${s}`).join("\n");
  if (key === "videoEmbeds") {
    return ((val as any[]) || []).map((v) => `${v?.platform ?? "?"}: ${v?.url ?? ""}`).join("\n");
  }
  if (Array.isArray(val)) return val.join(", ");
  return String(val);
}
