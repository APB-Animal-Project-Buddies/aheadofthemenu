/**
 * Fill in explicit estimates for "for serving" accompaniments that the central vague-
 * measure table can't derive: a cooked-rice serving, and syrup/sauce drizzles. All are
 * marked `optional` (they're serving accompaniments, not core to the dish). Original
 * wording stays in the note.
 *
 *   bun scripts/estimate-serving-measures.ts            # dry-run
 *   bun scripts/estimate-serving-measures.ts --execute  # apply
 */
import { graphql } from "../lib/nhost";

const execute = process.argv.includes("--execute");

// Cooked-rice servings -> 150 g, optional.
const RICE = [53, 60, 66];
// Syrup/sauce "for serving" -> 1 tbsp for <=4 servings, else 2 tbsp; optional.
const SERVE = [
  { id: 29, match: "maple syrup" },
  { id: 44, match: "maple syrup" },
  { id: 106, match: "tartare" },
  { id: 154, match: "cranberry" },
];
const isEmptyQty = (q: any) => q === null || q === undefined || q === "";

async function getDish(id: number) {
  const r = await graphql<{ dishes_by_pk: { id: number; dish_name: string; dish_data: any } | null }>(
    `query ($id: Int!) { dishes_by_pk(id: $id) { id dish_name dish_data } }`, { useAdminSecret: true, variables: { id } });
  return r.data?.dishes_by_pk ?? null;
}
async function save(id: number, data: any) {
  const up = await graphql<{ update_dishes: { affected_rows: number } }>(
    `mutation ($id: Int!, $data: jsonb!) { update_dishes(where: { id: { _eq: $id } }, _set: { dish_data: $data }) { affected_rows } }`,
    { useAdminSecret: true, variables: { id, data } });
  if (up.errors?.length) throw new Error(`update ${id} failed: ${JSON.stringify(up.errors)}`);
}

let applied = 0;
for (const id of RICE) {
  const d = await getDish(id); if (!d) { console.log(`  ! [${id}] not found`); continue; }
  let changed = false;
  for (const ing of (d.dish_data?.ingredients ?? [])) {
    if (/rice/i.test(ing?.name || "") && isEmptyQty(ing?.quantity)) {
      ing.quantity = 150; ing.unit = "g"; ing.optional = true; changed = true;
      console.log(`  [${id}] ${(d.dish_data?.title || d.dish_name).padEnd(26)} | "${ing.name}"  =>  150 g (optional)`);
    }
  }
  if (changed) { applied++; if (execute) await save(id, d.dish_data); }
}
for (const s of SERVE) {
  const d = await getDish(s.id); if (!d) { console.log(`  ! [${s.id}] not found`); continue; }
  const servings = Number(d.dish_data?.servings) || 0;
  const qty = servings > 0 && servings <= 4 ? 1 : 2;
  let changed = false;
  for (const ing of (d.dish_data?.ingredients ?? [])) {
    if ((ing?.name || "").toLowerCase().includes(s.match) && isEmptyQty(ing?.quantity)) {
      ing.quantity = qty; ing.unit = "tbsp"; ing.optional = true; changed = true;
      console.log(`  [${s.id}] ${(d.dish_data?.title || d.dish_name).padEnd(26)} | "${ing.name}"  =>  ${qty} tbsp (optional, ${servings} servings)`);
    }
  }
  if (changed) { applied++; if (execute) await save(s.id, d.dish_data); }
}
console.log(`\n${execute ? "APPLIED" : "DRY-RUN"}: ${applied} dishes.` + (execute ? "" : "  Re-run with --execute to apply."));
