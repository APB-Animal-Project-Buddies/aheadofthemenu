/**
 * Backfill dishes.creator_id from each dish's free-text dish_data.originalCreator,
 * resolving the name to a creators row via lib/creators.ts pickCreatorMatch
 * (exact display_name beats exact creator_name; ties → earliest created_at).
 *
 * REQUIRES migration 1783400000001_add_creator_id_to_dishes to be applied first.
 *
 * ⚠️  localhost/.env here is PROD-WIRED. This writes to the production DB.
 *     Dry-run is the DEFAULT. Pass --apply to actually write.
 *
 *   bun scripts/backfill-dish-creator-id.ts            # dry run — reports match rate
 *   bun scripts/backfill-dish-creator-id.ts --apply    # write creator_id to the live DB
 *
 * Unmatched names are reported so they can be added to the creators table (or an
 * alias map) before a second pass. Only sets creator_id where it is currently null.
 */
import { graphql } from "../lib/nhost";
import { pickCreatorMatch, type CreatorRow } from "../lib/creators";

const APPLY = process.argv.includes("--apply");

async function allCreators(): Promise<CreatorRow[]> {
  const res = await graphql<{ creators: CreatorRow[] }>(
    `query { creators(order_by: { created_at: asc }) { id display_name creator_name slug created_at } }`,
    { useAdminSecret: true }
  );
  if (res.errors?.length) throw new Error(res.errors[0].message);
  return res.data?.creators ?? [];
}

async function allDishes(): Promise<Array<{ id: number; dish_data: any; creator_id: string | null }>> {
  const res = await graphql<{ dishes: Array<{ id: number; dish_data: any; creator_id: string | null }> }>(
    `query { dishes { id dish_data creator_id } }`,
    { useAdminSecret: true }
  );
  if (res.errors?.length) throw new Error(res.errors[0].message);
  return res.data?.dishes ?? [];
}

async function main() {
  const [creators, dishes] = await Promise.all([allCreators(), allDishes()]);
  console.log(`${creators.length} creators, ${dishes.length} dishes`);
  console.log(APPLY ? "MODE: --apply (WRITING TO LIVE DB)\n" : "MODE: dry run (no writes)\n");

  let matched = 0, already = 0, wrote = 0;
  const unmatched = new Map<string, number>();

  for (const dish of dishes) {
    const name = String(dish.dish_data?.originalCreator ?? "").trim();
    if (!name) continue;
    if (dish.creator_id) { already++; continue; }
    const match = pickCreatorMatch(name, creators);
    if (!match) {
      unmatched.set(name, (unmatched.get(name) ?? 0) + 1);
      continue;
    }
    matched++;
    if (!APPLY) continue;
    const res = await graphql<{ update_dishes_by_pk: { id: number } | null }>(
      `mutation ($id: Int!, $cid: uuid!) {
         update_dishes_by_pk(pk_columns: { id: $id }, _set: { creator_id: $cid }) { id }
       }`,
      { useAdminSecret: true, variables: { id: dish.id, cid: match.id } }
    );
    if (res.errors?.length) console.error(`  ✗ dish #${dish.id}: ${res.errors[0].message}`);
    else { wrote++; }
  }

  console.log(`Matched: ${matched}${APPLY ? ` (wrote ${wrote})` : ""} | already linked: ${already} | unmatched names: ${unmatched.size}`);
  if (unmatched.size) {
    console.log("\nUnmatched originalCreator values (add these to creators, or an alias map):");
    for (const [name, n] of [...unmatched.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`  ${n}×  ${name}`);
    }
  }
  if (!APPLY) console.log("\nRe-run with --apply to write (⚠️ prod).");
}

main();
