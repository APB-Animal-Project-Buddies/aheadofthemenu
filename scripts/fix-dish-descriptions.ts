/**
 * Audit (and optionally repair) dish descriptions.
 *
 *   bun scripts/fix-dish-descriptions.ts              # dry run — prints a diff, writes nothing
 *   bun scripts/fix-dish-descriptions.ts --execute    # applies the mechanical fixes
 *
 * ⚠️  This talks to the PRODUCTION database. The dry run is read-only; --execute
 * issues real UPDATEs. Always read the dry-run diff first.
 *
 * Why this exists: /eat-this/{id} and /dishes/{id} now emit <meta description>
 * built from these strings, so they became search snippets. Text like
 * "…and more.jalapenos, picked carrots &amp; daikon," is what Google would show.
 *
 * Scope — MECHANICAL fixes only, the ones that are unambiguously safe:
 *   - missing space after sentence punctuation ("more.jalapenos")
 *   - repeated / non-standard whitespace
 *   - dangling trailing separators (", " / " -" / ";")
 *   - space before punctuation ("carrots ,")
 *   - repeated punctuation ("word,,")
 *
 * Deliberately NOT auto-fixed: spelling and wording ("picked" → "pickled").
 * Those need a human decision about what the author meant, so they are reported
 * under SUSPECT for manual review and never rewritten.
 */
import { graphql } from "../lib/nhost";
import { cleanDescription, fixSuspects, suspects } from "../lib/description-clean";

const ARGV = process.argv.slice(2);
const EXECUTE = ARGV.includes("--execute");
// Wording changes alter meaning, so they need their own opt-in on top of --execute.
const WORDING = ARGV.includes("--wording");

type Row = { id: string; name: string; description: string | null };

async function main() {
  console.log(EXECUTE ? "MODE: EXECUTE (will write)" : "MODE: dry run (read-only)");
  console.log("");

  const res = await graphql<{ restaurant_dishes: Row[] }>(
    `query { restaurant_dishes { id name description } }`,
    { useAdminSecret: true }
  );
  if (res.errors?.length) throw new Error(res.errors[0].message);
  const rows = res.data?.restaurant_dishes ?? [];

  const changes: Array<{ row: Row; next: string }> = [];
  const flagged: Array<{ row: Row; notes: string[] }> = [];

  for (const row of rows) {
    const current = row.description ?? "";
    if (!current.trim()) continue;

    let next = cleanDescription(current);
    if (WORDING) next = fixSuspects(next);
    if (next !== current) changes.push({ row, next });

    const notes = suspects(next);
    if (notes.length) flagged.push({ row, notes });
  }

  console.log(`Scanned ${rows.length} eat-this dishes.\n`);

  console.log(`── MECHANICAL FIXES (${changes.length}) ──`);
  for (const { row, next } of changes) {
    console.log(`\n${row.name}  [${row.id}]`);
    console.log(`  -  ${JSON.stringify(row.description)}`);
    console.log(`  +  ${JSON.stringify(next)}`);
  }

  console.log(`\n\n── SUSPECT WORDING (${flagged.length}) — ${WORDING ? "applied above" : "NOT auto-fixed; pass --wording"} ──`);
  for (const { row, notes } of flagged) {
    console.log(`\n${row.name}  [${row.id}]`);
    for (const n of notes) console.log(`  ? ${n}`);
  }

  if (!EXECUTE) {
    console.log(`\n\nDry run — nothing written. Re-run with --execute${WORDING ? " --wording" : ""} to apply the ${changes.length} change(s).`);
    return;
  }

  console.log(`\n\nApplying ${changes.length} updates…`);
  let ok = 0;
  for (const { row, next } of changes) {
    const up = await graphql(
      `mutation ($id: uuid!, $d: String!) {
         update_restaurant_dishes_by_pk(pk_columns: { id: $id }, _set: { description: $d }) { id }
       }`,
      { useAdminSecret: true, variables: { id: row.id, d: next } }
    );
    if (up.errors?.length) {
      console.error(`  FAILED ${row.name}: ${up.errors[0].message}`);
    } else {
      ok += 1;
    }
  }
  console.log(`Done — ${ok}/${changes.length} updated.`);
}

await main();
