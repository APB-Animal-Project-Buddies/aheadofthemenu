/**
 * Shared seeding + drift-reconcile helper for the add-<dish>.ts scripts.
 *
 * The seed script is the SOURCE OF TRUTH. Three modes:
 *   (default)   dry     — print the built dish_data, touch nothing.
 *   --check     compare the built dish_data against the live row, REPORT drift, no write.
 *   --execute   create the dish, or UPDATE it to match when it already exists (script wins).
 *
 * Drift is detected on a canonicalized comparison (object keys sorted recursively)
 * so Postgres jsonb key-reordering never reads as a false difference; array order
 * IS preserved (ingredient/step order is meaningful).
 */

export type SeedMode = "dry" | "check" | "execute";

export function seedModeFromArgv(argv: string[]): SeedMode {
  if (argv.includes("--execute")) return "execute";
  if (argv.includes("--check")) return "check";
  return "dry";
}

/** Recursively sort object keys (arrays keep their order) → order-insensitive compare. */
function canonical(v: any): any {
  if (Array.isArray(v)) return v.map(canonical);
  if (v && typeof v === "object") {
    const out: Record<string, any> = {};
    for (const k of Object.keys(v).sort()) out[k] = canonical(v[k]);
    return out;
  }
  return v;
}
const eq = (a: any, b: any) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));

/** Top-level dish_data keys whose value differs between the live row and the seed. */
function driftedKeys(current: any, next: any): string[] {
  const keys = new Set([...Object.keys(current || {}), ...Object.keys(next || {})]);
  return [...keys].filter((k) => !eq(current?.[k], next?.[k])).sort();
}

/**
 * Reconcile one dish by name. Returns the dish id (0 when nothing was created in a
 * non-execute mode). Prints a one-line status per the mode.
 */
export async function seedDish(name: string, dishData: Record<string, unknown>, mode: SeedMode): Promise<number> {
  // Lazy import so a pure dry-run needs no Nhost env.
  const { graphql } = await import("../lib/nhost");

  const found = await graphql<{ dishes: Array<{ id: number; dish_data: any }> }>(
    `query ($name: String!) { dishes(where: { dish_name: { _eq: $name } }, limit: 1) { id dish_data } }`,
    { useAdminSecret: true, variables: { name } }
  );
  if (found.errors?.length) throw new Error(`lookup failed for "${name}": ${JSON.stringify(found.errors)}`);
  const existing = found.data?.dishes?.[0];

  if (!existing) {
    if (mode !== "execute") {
      console.log(`  ~ would CREATE: ${name}`);
      return 0;
    }
    const res = await graphql<{ insert_dishes_one: { id: number } }>(
      `mutation ($name: String!, $data: jsonb!) { insert_dishes_one(object: { dish_name: $name, dish_data: $data }) { id } }`,
      { useAdminSecret: true, variables: { name, data: dishData } }
    );
    if (res.errors?.length) throw new Error(`insert failed for "${name}": ${JSON.stringify(res.errors)}`);
    const id = res.data!.insert_dishes_one.id;
    console.log(`  + created: ${name} (id ${id})`);
    return id;
  }

  const drift = driftedKeys(existing.dish_data || {}, dishData);
  if (drift.length === 0) {
    console.log(`  = in sync: ${name} (id ${existing.id}) — no drift`);
    return existing.id;
  }

  if (mode !== "execute") {
    console.log(`  ! DRIFT: ${name} (id ${existing.id}) — differs in: ${drift.join(", ")}`);
    console.log(`          run with --execute to reconcile (the seed wins).`);
    return existing.id;
  }

  const upd = await graphql<{ update_dishes: { affected_rows: number } }>(
    `mutation ($id: Int!, $name: String!, $data: jsonb!) {
       update_dishes(where: { id: { _eq: $id } }, _set: { dish_name: $name, dish_data: $data }) { affected_rows }
     }`,
    { useAdminSecret: true, variables: { id: existing.id, name, data: dishData } }
  );
  if (upd.errors?.length) throw new Error(`update failed for "${name}": ${JSON.stringify(upd.errors)}`);
  console.log(`  ↻ reconciled: ${name} (id ${existing.id}) — updated: ${drift.join(", ")}`);
  return existing.id;
}

/** Print the built dish_data, then seed/check per the mode. Used by every add-<dish>.ts. */
export async function runSeed(name: string, dishData: Record<string, unknown>, mode: SeedMode): Promise<void> {
  console.log(JSON.stringify(dishData, null, 2));
  if (mode === "dry") {
    console.log(`\nDRY RUN — no DB. Use --check to compare against the live dish, or --execute to create/reconcile.`);
    return;
  }
  console.log(`\n${mode === "check" ? "CHECK" : "EXECUTE"} — "${name}"...`);
  await seedDish(name, dishData, mode);
}
