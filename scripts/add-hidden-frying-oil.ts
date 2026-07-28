/**
 * Add a hidden_ingredients "oil / absorbed" entry to deep- and pan-fried dishes, so
 * nutrition can account for oil the food soaks up while the visible "for frying" line
 * stays unquantified. Estimates are per-batch (whole recipe), rough (~15-20% of fried
 * weight for deep-fry). hidden_ingredients never render on the dish page.
 *
 *   bun scripts/add-hidden-frying-oil.ts            # dry-run
 *   bun scripts/add-hidden-frying-oil.ts --execute  # apply
 */
import { graphql } from "../lib/nhost";

const execute = process.argv.includes("--execute");

// Reviewed per-dish estimates (tbsp absorbed, whole batch). `match` guards against id drift.
const OILS = [
  { id: 81,  match: "blini",   qty: 2, note: "absorbed (pan-fried)" },
  { id: 106, match: "crab cake", qty: 2, note: "absorbed (pan-fried)" },
  { id: 101, match: "donut",   qty: 6, note: "absorbed (deep-fried, ~15-20% of weight)" },
  { id: 117, match: "fried chicken", qty: 5, note: "absorbed (deep-fried, ~15-20% of weight)" },
  { id: 116, match: "fish taco", qty: 8, note: "absorbed (deep-fried, ~15-20% of weight)" },
  { id: 195, match: "panisse", qty: 4, note: "absorbed (deep-fried)" },
  { id: 68,  match: "batter",  qty: 6, note: "absorbed (deep-fried, ~15-20% of weight)" },
];

let applied = 0;
for (const o of OILS) {
  const res = await graphql<{ dishes_by_pk: { id: number; dish_name: string; dish_data: any } | null }>(
    `query ($id: Int!) { dishes_by_pk(id: $id) { id dish_name dish_data } }`,
    { useAdminSecret: true, variables: { id: o.id } });
  const d = res.data?.dishes_by_pk;
  if (!d) { console.log(`  ! [${o.id}] NOT FOUND — skipped`); continue; }
  const title = (d.dish_data?.title || d.dish_name || "").toLowerCase();
  if (!title.includes(o.match)) { console.log(`  ! [${o.id}] "${d.dish_name}" doesn't match "${o.match}" — skipped`); continue; }

  const hidden = Array.isArray(d.dish_data.hidden_ingredients) ? d.dish_data.hidden_ingredients : [];
  const existing = hidden.find((h: any) => (h?.name || "").toLowerCase() === "oil");
  const entry = { name: "oil", quantity: o.qty, unit: "tbsp", note: o.note };
  console.log(`  [${o.id}] ${(d.dish_data?.title || d.dish_name).padEnd(32)} => hidden oil ${o.qty} tbsp  (${o.note})${existing ? "  [already present, updating]" : ""}`);

  const next = existing ? hidden.map((h: any) => ((h?.name || "").toLowerCase() === "oil" ? entry : h)) : [...hidden, entry];
  d.dish_data.hidden_ingredients = next;
  applied++;
  if (execute) {
    const up = await graphql<{ update_dishes: { affected_rows: number } }>(
      `mutation ($id: Int!, $data: jsonb!) { update_dishes(where: { id: { _eq: $id } }, _set: { dish_data: $data }) { affected_rows } }`,
      { useAdminSecret: true, variables: { id: o.id, data: d.dish_data } });
    if (up.errors?.length) throw new Error(`update ${o.id} failed: ${JSON.stringify(up.errors)}`);
  }
}
console.log(`\n${execute ? "APPLIED" : "DRY-RUN"}: ${applied} dishes.` + (execute ? "" : "  Re-run with --execute to apply."));
