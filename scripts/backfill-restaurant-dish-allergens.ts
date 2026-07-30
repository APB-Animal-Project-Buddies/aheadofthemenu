// Backfill missing soy / gluten / coconut allergens onto eat-this restaurant dishes.
//
// The reverse-lookup catalog was seeded with `details.allergens` only where the
// source listed them, so hand-added dishes (the banh mis, the Chu Minh
// sandwiches, the Three Cats bakes) shipped with an empty details blob even
// though their own descriptions name the allergen outright.
//
// Every entry below is justified by text already in the dish's description or
// ingredients — nothing is inferred from the cuisine or the restaurant. Dishes
// where the allergen is only *likely* (an unspecified plant-based protein, a
// cookie base that might be corn-only) are deliberately left alone; guessing
// wrong in either direction is worse than a missing row a human can fill in.
//
// UNION semantics: only adds allergens, never removes or reorders existing ones.
//
// Usage:
//   bun run scripts/backfill-restaurant-dish-allergens.ts            # dry run
//   bun run scripts/backfill-restaurant-dish-allergens.ts --apply    # write
import { graphql } from "../lib/nhost";

const APPLY = process.argv.includes("--apply");

// Keyed by dish id (prefix) so a renamed dish can't silently retarget a different
// row; `name` is re-checked against the live row before any write.
const BACKFILL: Array<{ id: string; name: string; add: string[]; because: string }> = [
  { id: "35c9b09f", name: "Teriyaki Latte", add: ["soy", "gluten"],
    because: "described as a soy sauce latte; brewed soy sauce is wheat-based" },
  { id: "7bdbce3e", name: "Butter Mochi", add: ["coconut"],
    because: "coconut flakes on top (mochiko is rice flour, so no gluten)" },
  { id: "b78cb547", name: "Chorizo Banh Mi", add: ["soy", "gluten"],
    because: "soy chorizo, soyrizo, Maggi seasoning, toasted baguette" },
  { id: "09da1f63", name: "Braised Tofu Banh Mi", add: ["soy", "gluten"],
    because: "soy braised tofu, toasted baguette" },
  { id: "83370494", name: "Spicy Tofu Sandwich", add: ["soy", "gluten"],
    because: "tofu filling in a sandwich roll" },
  { id: "3cf9a867", name: "Meatball Sandwich", add: ["soy", "gluten"],
    because: "tofu-based meatballs served as a sub" },
  { id: "b23439e8", name: "Barbecue Pork Sandwich", add: ["gluten"],
    because: "banh mi sandwich roll" },
  { id: "ed4bd74f", name: "Spicy Lemongrass Chicken Sandwich", add: ["gluten"],
    because: "seasoned seitan in a banh mi roll — seitan is wheat gluten" },
  { id: "7efe0f19", name: "Sesame Beef Sandwich", add: ["gluten"],
    because: "seitan 'beef' in a sandwich roll — seitan is wheat gluten" },
  { id: "83c145c6", name: "Chimmichanga", add: ["gluten"],
    because: "fried flour tortilla" },
  { id: "eea16727", name: "Quesadilla", add: ["gluten"],
    because: "flour tortilla" },
  { id: "1b52feb5", name: "Bacon Sandwich", add: ["gluten"],
    because: "served as a sandwich on bread" },
  { id: "fb0c031d", name: "Lemon Loaf", add: ["gluten"],
    because: "wheat-flour loaf cake (vendor labels its GF items explicitly)" },
  { id: "8438f2ff", name: "Earl Grey Tea Cake", add: ["gluten"],
    because: "wheat-flour cake (vendor labels its GF items explicitly)" },
  { id: "5aca6223", name: "Vietnamese Coffee", add: ["coconut"],
    because: "coconut condensed milk" },
  { id: "019af532", name: "Black Sesame Latte", add: ["sesame"],
    because: "black sesame is the defining ingredient" },
  { id: "b07481d7", name: "Horchata", add: ["nuts"],
    because: "made with almonds" },
];

type Row = { id: string; name: string; details: any; restaurant: { name: string } | null };

const res = await graphql<{ restaurant_dishes: Row[] }>(
  `query { restaurant_dishes { id name details restaurant { name } } }`,
  { useAdminSecret: true }
);
if (res.errors?.length) {
  console.error("Query failed:", res.errors);
  process.exit(1);
}
const rows = res.data?.restaurant_dishes ?? [];

let changed = 0;
for (const entry of BACKFILL) {
  const matches = rows.filter((r) => r.id.startsWith(entry.id));
  if (matches.length !== 1) {
    console.error(`SKIP ${entry.name}: ${matches.length} rows matched id prefix ${entry.id}`);
    continue;
  }
  const row = matches[0]!;
  if (row.name !== entry.name) {
    console.error(`SKIP ${entry.id}: expected "${entry.name}" but row is "${row.name}"`);
    continue;
  }

  const details = { ...(row.details ?? {}) };
  const current: Array<{ name: string; optional?: boolean }> = details.allergens ?? [];
  const have = new Set(current.map((a) => a.name));
  const missing = entry.add.filter((a) => !have.has(a));
  if (!missing.length) {
    console.log(`  ok    ${row.restaurant?.name} :: ${row.name} — already has [${entry.add.join(", ")}]`);
    continue;
  }

  details.allergens = [...current, ...missing.map((name) => ({ name }))];
  changed++;
  console.log(
    `  ADD   ${row.restaurant?.name} :: ${row.name}\n` +
      `        [${[...have].join(", ") || "none"}] -> [${details.allergens.map((a: any) => a.name).join(", ")}]\n` +
      `        why: ${entry.because}`
  );

  if (APPLY) {
    const upd = await graphql<{ update_restaurant_dishes_by_pk: { id: string } | null }>(
      `mutation ($id: uuid!, $details: jsonb!) {
         update_restaurant_dishes_by_pk(pk_columns: { id: $id }, _set: { details: $details }) { id }
       }`,
      { variables: { id: row.id, details }, useAdminSecret: true }
    );
    if (upd.errors?.length) {
      console.error(`        WRITE FAILED:`, upd.errors);
      process.exit(1);
    }
  }
}

console.log(`\n${changed} dish(es) ${APPLY ? "updated" : "would change"}${APPLY ? "" : " — re-run with --apply to write"}.`);
