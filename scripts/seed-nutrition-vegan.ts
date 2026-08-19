// Seed ONLY the plant-based, verified rows from scripts/data/nutrition-seed.jsonl into
// public.nutrition. "Plant-based" = vegan_classifications says `vegan` (the real signal —
// NOT foods.is_vegan, which is the schema default `true` on all 8,092 rows and means
// nothing). "Verified" = the food actually has researched nutrient values.
//
//   bun scripts/seed-nutrition-vegan.ts                 # dry run — counts + a sample row
//   bun scripts/seed-nutrition-vegan.ts --apply         # write
//   bun scripts/seed-nutrition-vegan.ts --apply --all-vegan   # include unresearched shells
//
// Idempotent: upserts on nutrition_pkey, so re-running refreshes rows in place.
// NOTE: this writes to the production Nhost database. Dry run is the default.
export {};

import { graphql } from "../lib/nhost";
import { normalize } from "../lib/ingredients";

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const allVegan = args.includes("--all-vegan");
const num = (n: string, d: number) => {
  const a = args.find((x) => x.startsWith(`--${n}=`));
  return a ? Math.max(1, parseInt(a.split("=")[1], 10) || d) : d;
};
const batchSize = num("batch", 100);

const SRC = "scripts/data/nutrition-seed.jsonl";

const UPSERT = `
  mutation UpsertNutrition($rows: [nutrition_insert_input!]!) {
    insert_nutrition(
      objects: $rows,
      on_conflict: {
        constraint: nutrition_pkey,
        update_columns: [source, source_ref, name, norm_key, data_type, category,
                         vegan_status, is_researched, nutrient_count, researched_at,
                         metadata, updated_at]
      }
    ) { affected_rows }
  }
`;

const all = (await Bun.file(SRC).text()).trim().split("\n").filter(Boolean).map((l) => JSON.parse(l));

// `ambiguous` is INCLUDED by default per the user's ruling ("You can include the 192
// ambiguous ingredients for now"), but it is shipped AS ambiguous — vegan_status carries
// the real verdict. It is never relabelled `vegan`. 42 of the ambiguous rows are bread and
// 22 are chocolate; a USDA name does not reveal whether they contain honey, dairy or egg,
// so asserting vegan would be exactly the false claim we are trying to avoid. Consumers
// filter on vegan_status.
const INCLUDED_CLASSES = new Set(
  args.includes("--strict") ? ["vegan"] : ["vegan", "ambiguous"]
);
const isIncluded = (r: any) => INCLUDED_CLASSES.has(r.vegan_classification?.classification);
const picked = all.filter((r) => isIncluded(r) && (allVegan || r.nutrition.is_researched));

// The blob IS the row; promoted columns are extracted from it purely for querying.
const toRow = (r: any) => {
  // Drop foods.is_vegan on the way in — it is `true` on all 8,092 rows because it is the
  // SQLite schema default (scripts/schema.sql:22), never populated. Persisting it would
  // hand the next reader a field that looks authoritative and is pure noise.
  const { is_vegan, ...flags } = r.flags ?? {};
  const metadata = { ...r, flags };
  return {
    id: `usda_fdc:${r.fdc_id}`,
    source: "usda_fdc",
    source_ref: String(r.fdc_id),
    name: r.name,
    norm_key: normalize(r.name),
    data_type: r.source.data_type,
    category: r.source.category,
    vegan_status: r.vegan_classification?.classification ?? "unknown",
    is_researched: r.nutrition.is_researched,
    nutrient_count: r.nutrition.count,
    researched_at: r.nutrition.researched_at,
    metadata,
    updated_at: new Date().toISOString(),
  };
};

const cls: Record<string, number> = {};
for (const r of all) cls[r.vegan_classification?.classification ?? "(unclassified)"] =
  (cls[r.vegan_classification?.classification ?? "(unclassified)"] ?? 0) + 1;

console.log(`${all.length} rows in seed`);
console.log(`  by classification:`, JSON.stringify(cls));
console.log(`  selected (vegan${allVegan ? "" : " + researched"}): ${picked.length}`);
const vals = picked.reduce((a, r) => a + r.nutrition.count, 0);
console.log(`  nutrient values carried: ${vals} (avg ${(vals / (picked.length || 1)).toFixed(1)}/food)`);
const bytes = picked.reduce((a, r) => a + JSON.stringify(r).length, 0);
console.log(`  payload: ~${(bytes / 1e6).toFixed(2)} MB in ${Math.ceil(picked.length / batchSize)} batches of ${batchSize}`);

if (!apply) {
  const s = toRow(picked[0]);
  console.log("\nsample row (metadata truncated):");
  console.log(JSON.stringify({ ...s, metadata: `<${JSON.stringify(s.metadata).length} bytes>` }, null, 2));
  console.log("\ndry run — nothing written. re-run with --apply.");
  process.exit(0);
}

// Nhost resets the connection on large GraphQL bodies — a 25-row batch is ~650 KB because
// each row carries its whole nutrient panel with per-value citations. Retry with backoff
// rather than failing the run: the mutation is an upsert on nutrition_pkey, so a retried
// batch is a no-op if it actually landed before the socket dropped.
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function upsertWithRetry(rows: any[], label: string, tries = 5): Promise<number> {
  let wait = 1000;
  for (let attempt = 1; attempt <= tries; attempt++) {
    try {
      const res = await graphql<{ insert_nutrition: { affected_rows: number } }>(UPSERT, {
        variables: { rows },
        useAdminSecret: true,
      });
      if (res.errors?.length) throw new Error(res.errors.map((e) => e.message).join("; "));
      return res.data?.insert_nutrition.affected_rows ?? 0;
    } catch (e: any) {
      const transient = /ECONNRESET|socket|fetch failed|timeout|502|503|504/i.test(String(e?.message ?? e));
      if (!transient || attempt === tries) throw new Error(`${label}: ${e?.message ?? e}`);
      console.error(`    ${label} attempt ${attempt} failed (${e?.code ?? "transient"}) — retrying in ${wait}ms`);
      await sleep(wait);
      wait = Math.min(wait * 2, 15000);
    }
  }
  return 0;
}

let affected = 0;
for (let i = 0; i < picked.length; i += batchSize) {
  const rows = picked.slice(i, i + batchSize).map(toRow);
  affected += await upsertWithRetry(rows, `batch at ${i}`);
  console.error(`  ${Math.min(i + batchSize, picked.length)}/${picked.length} · affected=${affected}`);
}
console.log(`\ndone — ${affected} rows upserted into public.nutrition`);
