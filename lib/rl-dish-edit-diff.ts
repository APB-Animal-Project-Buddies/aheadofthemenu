/**
 * Diff helpers for the Eat This! (reverse-lookup) dish-edit review UI
 * (app/admin/edits, "Eat This!" tab). Pure + unit-testable, mirroring
 * lib/dish-edit-diff.ts. A proposal only carries the fields it changes, so the
 * diff compares each proposed field against the dish's current value.
 */

// Editable dish fields surfaced in the diff, in display order. Every field
// validateDishEdit can emit must appear here or a proposal touching only that
// field would render as "no changes".
export const RL_EDIT_FIELDS: Array<[key: string, label: string]> = [
  ["name", "Name"],
  ["description", "Description"],
  ["tags", "Tags"],
  ["availability", "Availability"],
];

/** True when two field values differ (null-normalized, order-sensitive). */
export function fieldChanged(a: unknown, b: unknown): boolean {
  return JSON.stringify(a ?? null) !== JSON.stringify(b ?? null);
}

/**
 * The [key, label] pairs whose PROPOSED value differs from the current dish.
 * Only keys present in `proposed` are considered (a proposal is a partial patch).
 */
export function diffRlDishFields(current: any, proposed: any): Array<[string, string]> {
  return RL_EDIT_FIELDS.filter(
    ([k]) => proposed?.[k] !== undefined && fieldChanged(current?.[k], proposed?.[k])
  );
}

/** Human-readable rendering of one field value for the diff view. */
export function formatRlField(_key: string, val: unknown): string {
  if (val === undefined || val === null || val === "") return "—";
  if (Array.isArray(val)) return val.join(", ");
  return String(val);
}
