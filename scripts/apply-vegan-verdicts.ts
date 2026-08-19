// Write the full vegan classification to prod public.ingredients.
//
// TWO LAYERS, and the order matters:
//   1. the DETERMINISTIC pass in classify-vegan-ingredients.ts (ANIMAL_WORDS, E_ANIMAL,
//      E_SOURCE_DEPENDENT, PLANT_OVERRIDES, E-number default)
//   2. the MANUAL verdicts in scripts/data/vegan-verdicts-manual.json, which cover ONLY the
//      names that survived layer 1
// Layer 2's "anything not listed is vegan" rule is ONLY valid on top of layer 1 — on its own
// it would mark beef, milk and gelatin vegan, because those never reached the residue. This
// script composes both, so every one of the 4,241 rows gets a verdict from a known layer and
// records which one.
//
//   bun scripts/apply-vegan-verdicts.ts            # dry run — counts + the hard cases
//   bun scripts/apply-vegan-verdicts.ts --apply    # write
export {};

import { graphql } from "../lib/nhost";

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const batchSize = 100;

type Cls = "vegan" | "non_vegan" | "ambiguous" | "junk";

const classified: { id: string; name: string; vegan: boolean | null; cls: string; why: string }[] =
  JSON.parse(await Bun.file(`${process.env.TMPDIR}/probe/ing-classified.json`).text());
const V = JSON.parse(await Bun.file("scripts/data/vegan-verdicts-manual.json").text());

function verdictFor(row: { name: string; cls: string; why: string }): { cls: Cls; why: string; layer: string } {
  // layer 2 overrides layer 1 only where layer 1 said needs_review
  if (row.cls === "needs_review") {
    if (V.non_vegan[row.name]) return { cls: "non_vegan", why: V.non_vegan[row.name], layer: "manual" };
    if (V.ambiguous[row.name]) return { cls: "ambiguous", why: V.ambiguous[row.name], layer: "manual" };
    if (V.junk_delete_candidates[row.name])
      return { cls: "junk", why: V.junk_delete_candidates[row.name], layer: "manual" };
    const note = V.notable_vegan_by_plant_source_rule[row.name];
    return { cls: "vegan", why: note ?? "reviewed, no animal or ambiguous indication", layer: "manual" };
  }
  return { cls: row.cls as Cls, why: row.why, layer: "deterministic" };
}

const rows = classified.map((r) => ({ ...r, v: verdictFor(r) }));

const tally: Record<string, number> = {};
for (const r of rows) tally[r.v.cls] = (tally[r.v.cls] ?? 0) + 1;
console.log(`${rows.length} prod ingredients`);
console.log(`  verdicts:`, JSON.stringify(tally));
const byLayer: Record<string, number> = {};
for (const r of rows) byLayer[r.v.layer] = (byLayer[r.v.layer] ?? 0) + 1;
console.log(`  by layer:`, JSON.stringify(byLayer));

// `vegan` is BOOLEAN and cannot express ambiguous. NULL + the metadata verdict is the only
// honest encoding — collapsing ambiguous to either true or false would be a false claim.
const toBool = (c: Cls): boolean | null => (c === "vegan" ? true : c === "non_vegan" ? false : null);

// junk rows are NOT reclassified here — deletion is a separate task that needs the
// dish-reference check first. They keep their existing `vegan` and are only tagged.
// `_append` MERGES at the jsonb top level; `_set` on metadata would REPLACE the whole blob.
// That distinction is not academic — replacing the blob is exactly how the seed loader
// silently reverted the fluoride correction earlier in this project. Use the merge operator
// even when the blobs are currently near-empty, because the next writer will not know they
// were.
const MUTATION = `
  mutation SetVegan($id: String!, $vegan: Boolean, $meta: jsonb!) {
    update_ingredients_by_pk(
      pk_columns: {id: $id},
      _set: {vegan: $vegan},
      _append: {metadata: $meta}
    ) { id }
  }
`;

// Citations already established for specific rows, carried forward so a re-classification
// does not drop the evidence that justified the original verdict.
const KNOWN_SOURCES: Record<string, string> = {
  "en:e441": "https://doublecheckvegan.com/ingredients/e441/",
};

const HARD_CASES = [
  "Teuthida", "undulate venus", "sea squirt", "worcestershire sauce", "white chocolate",
  "retinol", "taurine", "skyr", "Quorn mushroom product", "natural colours",
  "vegetable pigment", "vegetable margarine", "vitamin D yeast", "red curry paste", "stuffed olives",
];
console.log(`\nhard cases (the ones no keyword rule reaches):`);
for (const n of HARD_CASES) {
  const r = rows.find((x) => x.name === n);
  console.log(`  ${(r?.v.cls ?? "NOT FOUND").padEnd(11)} ${n}`);
}

if (!apply) {
  console.log(`\ndry run — nothing written. re-run with --apply.`);
  process.exit(0);
}

// RESUMABLE. The first run of this script died at ~199 rows on an uncaught ECONNRESET while
// the task wrapper still reported exit code 0 — a false success that was only caught by
// querying prod. Two fixes, both of which already existed in seed-nutrition-vegan.ts and
// should have been carried over the first time:
//   - retry with backoff on transient socket/5xx errors
//   - much lower concurrency; 100 simultaneous mutations is what triggered the reset
// Re-running is safe: rows that already carry an identical verdict are skipped, so a resume
// costs nothing and a full re-run is idempotent.
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function withRetry<T>(fn: () => Promise<T>, label: string, tries = 5): Promise<T | null> {
  let wait = 800;
  for (let attempt = 1; attempt <= tries; attempt++) {
    try { return await fn(); }
    catch (e: any) {
      const transient = /ECONNRESET|socket|fetch failed|timeout|50[234]/i.test(String(e?.message ?? e));
      if (!transient || attempt === tries) { console.error(`  ${label}: ${e?.message ?? e}`); return null; }
      await sleep(wait);
      wait = Math.min(wait * 2, 10000);
    }
  }
  return null;
}

// skip rows already carrying the verdict we are about to write
const existing = new Map<string, string>();
{
  const q = `query { ingredients { id metadata } }`;
  const res = await withRetry(() => graphql<{ ingredients: any[] }>(q, { useAdminSecret: true }), "prefetch");
  for (const row of res?.data?.ingredients ?? []) {
    const v = row.metadata?.vegan_verdict;
    if (v?.value) existing.set(row.id, v.value);
  }
  console.log(`  ${existing.size} rows already carry a verdict — will skip those that match`);
}

const todo = rows.filter((r) => existing.get(r.id) !== r.v.cls);
console.log(`  ${todo.length} rows to write\n`);

let ok = 0, failed = 0;
const CONCURRENCY = 8;
for (let i = 0; i < todo.length; i += CONCURRENCY) {
  const chunk = todo.slice(i, i + CONCURRENCY);
  await Promise.all(
    chunk.map(async (r) => {
      const meta = {
        vegan_verdict: {
          value: r.v.cls,
          reason: r.v.why,
          layer: r.v.layer,
          ...(KNOWN_SOURCES[r.id] ? { source: KNOWN_SOURCES[r.id] } : {}),
          classified_by: "scripts-to-nhost",
          classified_at: new Date().toISOString(),
        },
      };
      const res = await withRetry(
        () => graphql(MUTATION, {
          variables: { id: r.id, vegan: r.v.cls === "junk" ? r.vegan : toBool(r.v.cls), meta },
          useAdminSecret: true,
        }),
        r.id
      );
      if (!res || res.errors?.length) { failed++; if (failed < 4 && res?.errors) console.error(`  ${r.id}: ${res.errors[0].message}`); }
      else ok++;
    })
  );
  if (i % 400 === 0 || i + CONCURRENCY >= todo.length)
    console.error(`  ${Math.min(i + CONCURRENCY, todo.length)}/${todo.length} · ok=${ok} failed=${failed}`);
}
console.log(`\ndone — ${ok} updated, ${failed} failed`);
