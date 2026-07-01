// One-off helper: apply the pending schema changes directly to the linked Nhost
// (Hasura admin API) when the git auto-deploy isn't applying DB migrations.
// All statements are idempotent, so this is safe to re-run and won't conflict
// with a later `nhost`/hasura migration apply.
//
// Usage: bun run scripts/apply-nhost-migrations.ts
export {}; // module scope (allows top-level await)
const sub = process.env.NHOST_SUBDOMAIN;
const region = process.env.NHOST_REGION;
const secret = process.env.NHOST_GRAPHQL_SECRET;
if (!sub || !region || !secret) {
  console.error("Missing NHOST_SUBDOMAIN / NHOST_REGION / NHOST_GRAPHQL_SECRET");
  process.exit(1);
}
const base = `https://${sub}.hasura.${region}.nhost.run`;

async function hasura(path: string, payload: unknown) {
  const r = await fetch(base + path, {
    method: "POST",
    headers: { "content-type": "application/json", "x-hasura-admin-secret": secret as string },
    body: JSON.stringify(payload),
  });
  return { status: r.status, body: await r.text() };
}
async function runSql(label: string, sql: string) {
  const r = await hasura("/v2/query", { type: "run_sql", args: { source: "default", sql, cascade: false } });
  console.log(`${r.status < 400 ? "✓" : "✗"} ${label}` + (r.status < 400 ? "" : `  ${r.body.slice(0, 200)}`));
}
async function meta(label: string, payload: unknown) {
  const r = await hasura("/v1/metadata", payload as any);
  // "already tracked" / "already exists" are fine on re-run.
  const ok = r.status < 400 || /already/i.test(r.body);
  console.log(`${ok ? "✓" : "✗"} ${label}` + (ok ? "" : `  ${r.body.slice(0, 200)}`));
}

await runSql("dish_edits table", `
  CREATE TABLE IF NOT EXISTS dish_edits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dish_id INT NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
    proposed_data JSONB NOT NULL,
    proposer JSONB,
    note TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_at TIMESTAMPTZ
  );
  CREATE INDEX IF NOT EXISTS idx_dish_edits_status ON dish_edits(status);
  CREATE INDEX IF NOT EXISTS idx_dish_edits_dish_id ON dish_edits(dish_id);`);

await runSql("ingredients.allergens", `ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS allergens TEXT[] NOT NULL DEFAULT '{}';`);

await runSql("review_instance columns", `
  ALTER TABLE review_instance ADD COLUMN IF NOT EXISTS substituted BOOLEAN NOT NULL DEFAULT false;
  ALTER TABLE review_instance ADD COLUMN IF NOT EXISTS allergens TEXT[] NOT NULL DEFAULT '{}';
  ALTER TABLE review_instance ADD COLUMN IF NOT EXISTS substitutions JSONB NOT NULL DEFAULT '[]';`);

await meta("track dish_edits", { type: "pg_track_table", args: { source: "default", table: { schema: "public", name: "dish_edits" } } });
await meta("dish_edits.dish relationship", {
  type: "pg_create_object_relationship",
  args: { source: "default", table: { schema: "public", name: "dish_edits" }, name: "dish", using: { foreign_key_constraint_on: "dish_id" } },
});

console.log("Done.");
