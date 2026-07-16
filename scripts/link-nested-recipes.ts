/**
 * One-off: connect recipes to sub-recipe dishes they already reference, by setting
 * dish_data.ingredients[].nestedDishId. Candidates are ingredients whose normalized
 * "core" name exactly equals another dish's title core (e.g. "vegan mayonnaise" ->
 * dish "Vegan Mayonnaise"), plus two hand-picked Gauthier links the exact matcher
 * can't see (the ingredient name carries extra words). False positives from stopword
 * stripping are excluded (custard "powder"; "vegan burgers" -> "Vegan Burger Sauce").
 *
 *   bun scripts/link-nested-recipes.ts            # dry-run (plan only)
 *   bun scripts/link-nested-recipes.ts --execute  # apply updates
 */
import { graphql } from "../lib/nhost";

const execute = process.argv.includes("--execute");
const STOP = new Set(["sauce","powder","paste","mix","recipe","the","a","of","for","with","and","our","own"]);
const core = (s: string) => (s || "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\bvegan\b/g, " ")
  .split(/\s+/).map((w) => w.replace(/s$/, "")).filter((w) => w && !STOP.has(w)).join(" ").trim();

// Hand-picked links the exact matcher misses (ingredient name has extra words).
const MANUAL: Array<{ src: number; needle: string; target: number }> = [
  { src: 181, needle: "panisse", target: 195 },   // Tripes à la Niçoise -> Panisse
  { src: 191, needle: "faux gras", target: 180 }, // Soupe VGE -> Faux-Gras en Terrine
];
// Exclude these (false positives): custard powder is a commercial ingredient, and
// "vegan burgers" is a patty, not "Vegan Burger Sauce".
const isExcluded = (ingName: string, srcId: number, targetId: number) =>
  /powder/i.test(ingName) || (srcId === 78 && targetId === 86);

const res = await graphql<{ dishes: Array<{ id: number; dish_name: string; dish_data: any }> }>(
  `query { dishes { id dish_name dish_data } }`, { useAdminSecret: true });
const dishes = res.data?.dishes ?? [];
const byId = new Map(dishes.map((d) => [d.id, d]));
const index = dishes.map((d) => ({ id: d.id, title: d.dish_data?.title || d.dish_name, c: core(d.dish_data?.title || d.dish_name) }))
  .filter((t) => t.c.length >= 4);

let planned = 0, dishesTouched = 0;
for (const d of dishes) {
  const ings = Array.isArray(d.dish_data?.ingredients) ? d.dish_data.ingredients : [];
  let changed = false;
  for (const ing of ings) {
    if (ing?.nestedDishId) continue;
    const name = ing?.name || "";
    let target: { id: number; title: string } | null = null;

    const manual = MANUAL.find((m) => m.src === d.id && name.toLowerCase().includes(m.needle));
    if (manual) target = { id: manual.target, title: byId.get(manual.target)?.dish_data?.title || "" };
    else {
      const ic = core(name);
      const hit = ic ? index.find((t) => t.id !== d.id && t.c === ic) : null;
      if (hit && !isExcluded(name, d.id, hit.id)) target = { id: hit.id, title: hit.title };
    }
    if (!target) continue;
    console.log(`  [${d.id}] ${d.dish_data?.title || d.dish_name}  —  "${name}"  →  [${target.id}] ${target.title}`);
    ing.nestedDishId = target.id;
    changed = true;
    planned++;
  }
  if (changed) {
    dishesTouched++;
    if (execute) {
      const up = await graphql<{ update_dishes: { affected_rows: number } }>(
        `mutation ($id: Int!, $data: jsonb!) { update_dishes(where: { id: { _eq: $id } }, _set: { dish_data: $data }) { affected_rows } }`,
        { useAdminSecret: true, variables: { id: d.id, data: d.dish_data } });
      if (up.errors?.length) throw new Error(`update ${d.id} failed: ${JSON.stringify(up.errors)}`);
    }
  }
}
console.log(`\n${execute ? "APPLIED" : "DRY-RUN"}: ${planned} links across ${dishesTouched} dishes.` +
  (execute ? "" : "  Re-run with --execute to apply."));
