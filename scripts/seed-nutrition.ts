// Seed public.nutrition from scripts/data/nutrition-seed.jsonl (built by
// scripts/build-nutrition-seed.ts). Idempotent: upserts on the primary key, so re-running
// after a rebuild of the seed refreshes rows in place rather than duplicating them.
//
//   bun scripts/seed-nutrition.ts                        # dry run — counts + a sample row
//   bun scripts/seed-nutrition.ts --apply                # write everything (8,092 rows)
//   bun scripts/seed-nutrition.ts --apply --researched   # only the foods that have data (364)
//   bun scripts/seed-nutrition.ts --apply --batch=100 --limit=500
//
// NOTE: this writes to the production Nhost database. Dry run is the default for a reason.
export {};

import { graphql } from "../lib/nhost";
import { normalize } from "../lib/ingredients";

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const researchedOnly = args.includes("--researched");
const num = (n: string, d: number) => {
  const a = args.find((x) => x.startsWith(`--${n}=`));
  return a ? Math.max(1, parseInt(a.split("=")[1], 10) || d) : d;
};
const batchSize = num("batch", 200);
const limit = num("limit", Number.MAX_SAFE_INTEGER);

const SRC = "scripts/data/nutrition-seed.jsonl";

const UPSERT = `
  mutation UpsertNutrition($rows: [nutrition_insert_input!]!) {
    insert_nutrition(
      objects: $rows,
      on_conflict: {
        constraint: nutrition_pkey,
        update_columns: [source, source_ref, name, norm_key, data_type, category,
                         is_researched, nutrient_count, researched_at, metadata, updated_at]
      }
    ) { affected_rows }
  }
`;

const all = (await Bun.file(SRC).text()).trim().split("\n").filter(Boolean).map((l) => JSON.parse(l));
const picked = all.filter((r) => !researchedOnly || r.nutrition.is_researched).slice(0, limit);

// The blob is the row; the promoted columns are just extracted from it for querying.
const toRow = (r: any) => ({
  id: `usda_fdc:${r.fdc_id}`,
  source: "usda_fdc",
  source_ref: String(r.fdc_id),
  name: r.name,
  norm_key: normalize(r.name),
  data_type: r.source.data_type,
  category: r.source.category,
  is_researched: r.nutrition.is_researched,
  nutrient_count: r.nutrition.count,
  researched_at: r.nutrition.researched_at,
  metadata: r,
  updated_at: new Date().toISOString(),
});

console.log(`${all.length} rows in seed · ${picked.length} selected${researchedOnly ? " (--researched)" : ""}`);
console.log(`  with nutrition: ${picked.filter((r) => r.nutrition.is_researched).length} · shells: ${picked.filter((r) => !r.nutrition.is_researched).length}`);
const bytes = picked.reduce((a, r) => a + JSON.stringify(r).length, 0);
console.log(`  payload: ~${(bytes / 1e6).toFixed(1)} MB in ${Math.ceil(picked.length / batchSize)} batches of ${batchSize}`);

if (!apply) {
  const sample = toRow(picked.find((r) => r.nutrition.is_researched) ?? picked[0]);
  console.log("\nsample row (metadata truncated):");
  console.log(JSON.stringify({ ...sample, metadata: `<${JSON.stringify(sample.metadata).length} bytes>` }, null, 2));
  console.log("\ndry run — nothing written. re-run with --apply.");
  process.exit(0);
}

let affected = 0;
for (let i = 0; i < picked.length; i += batchSize) {
  const rows = picked.slice(i, i + batchSize).map(toRow);
  const res = await graphql<{ insert_nutrition: { affected_rows: number } }>(UPSERT, {
    variables: { rows },
    useAdminSecret: true,
  });
  if (res.errors?.length) throw new Error(`batch at ${i}: ${res.errors.map((e) => e.message).join("; ")}`);
  affected += res.data?.insert_nutrition.affected_rows ?? 0;
  console.error(`  ${Math.min(i + batchSize, picked.length)}/${picked.length} · affected=${affected}`);
}
console.log(`\ndone — ${affected} rows upserted into public.nutrition`);
