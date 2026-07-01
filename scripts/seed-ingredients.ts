import { readFileSync } from "node:fs";
import { graphql } from "../lib/nhost";
import { normalize, buildSearchText } from "../lib/ingredients";

type Seed = { id: string; name: string; synonyms: string[]; vegan: boolean | null; off_id: string };

function buildRows() {
  const seed = JSON.parse(readFileSync("scripts/data/ingredients-seed.json", "utf8")) as Seed[];
  const byKey = new Map<string, any>();
  for (const s of seed) {
    const key = normalize(s.name);
    const existing = byKey.get(key);
    if (existing) {
      existing.synonyms = Array.from(new Set([...existing.synonyms, s.name, ...s.synonyms]));
      existing.search_text = buildSearchText(existing.name, existing.synonyms);
      continue;
    }
    byKey.set(key, {
      id: s.id, name: s.name, synonyms: s.synonyms, norm_key: key,
      search_text: buildSearchText(s.name, s.synonyms),
      off_id: s.off_id, vegan: s.vegan, source: "off",
    });
  }
  return [...byKey.values()];
}

async function main() {
  const rows = buildRows();
  console.log(`Inserting ${rows.length} deduped ingredients…`);
  const BATCH = 500;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const objects = rows.slice(i, i + BATCH);
    const res = await graphql<{ insert_ingredients: { affected_rows: number } }>(
      `mutation Ins($objects: [ingredients_insert_input!]!) {
         insert_ingredients(objects: $objects,
           on_conflict: { constraint: ingredients_pkey, update_columns: [name, synonyms, norm_key, search_text, off_id, vegan] }
         ) { affected_rows }
       }`,
      { useAdminSecret: true, variables: { objects } }
    );
    if (res.errors?.length) throw new Error(JSON.stringify(res.errors));
    inserted += res.data?.insert_ingredients?.affected_rows ?? 0;
    console.log(`  ${Math.min(i + BATCH, rows.length)}/${rows.length}`);
  }
  console.log(`Done. affected_rows=${inserted}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
