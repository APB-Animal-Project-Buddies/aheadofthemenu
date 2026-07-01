#!/usr/bin/env node
/**
 * Syncs a local env file to a Vercel environment scope via REST API.
 * Adapted from the grassroots-web concept.
 *
 * Usage:
 *   bun run vercel:sync-prod            # .env.production → production
 *   bun run vercel:sync-preview         # .env.preview    → preview
 *   node scripts/sync-vercel-env.mjs <env-file> <scope-key>
 *
 * Required:
 *   - .vercel-config.json in repo root (committed, NO secrets):
 *       { "projectId": "prj_xxx", "teamId": "team_xxx",
 *         "scopes": { "prod": { "target": ["production"] }, ... } }
 *   - a Vercel token via either:
 *       env var  VERCEL_TOKEN=<token>            (CI)
 *       or       .vercel-config.local.json (gitignored): { "vercelToken": "<token>" }
 *     generate at https://vercel.com/account/tokens
 *
 * Secrets never enter git: real values live in the gitignored env file + on
 * Vercel; only project/team IDs (non-secret) are committed.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = resolve(__dirname, "..", ".vercel-config.json");
const CONFIG_LOCAL_PATH = resolve(__dirname, "..", ".vercel-config.local.json");

const [, , envFile, scopeKey] = process.argv;
if (!envFile || !scopeKey) {
  console.error("usage: node scripts/sync-vercel-env.mjs <env-file> <scope-key>");
  console.error("example: node scripts/sync-vercel-env.mjs .env.production prod");
  process.exit(2);
}
if (!existsSync(envFile)) {
  console.error(`error: ${envFile} not found`);
  process.exit(2);
}
if (!existsSync(CONFIG_PATH)) {
  console.error(`error: ${CONFIG_PATH} not found (needs projectId/teamId/scopes)`);
  process.exit(2);
}

const config = JSON.parse(readFileSync(CONFIG_PATH, "utf8"));

// Token: VERCEL_TOKEN env var wins; else .vercel-config.local.json (gitignored).
let vercelToken = process.env.VERCEL_TOKEN;
if (!vercelToken && existsSync(CONFIG_LOCAL_PATH)) {
  vercelToken = JSON.parse(readFileSync(CONFIG_LOCAL_PATH, "utf8")).vercelToken;
}
if (!vercelToken) {
  console.error("error: no Vercel token. Set VERCEL_TOKEN or add .vercel-config.local.json");
  console.error("  { \"vercelToken\": \"<token from https://vercel.com/account/tokens>\" }");
  process.exit(2);
}

const projectId = process.env.VERCEL_PROJECT_ID ?? config.projectId;
const teamId = process.env.VERCEL_TEAM_ID ?? config.teamId;
if (!projectId || String(projectId).includes("REPLACE")) {
  console.error("error: set a real projectId in .vercel-config.json (or VERCEL_PROJECT_ID)");
  process.exit(2);
}

const scope = config.scopes?.[scopeKey];
if (!scope?.target?.length) {
  console.error(`error: scopes["${scopeKey}"].target missing in .vercel-config.json`);
  console.error(`  available: ${Object.keys(config.scopes ?? {}).join(", ") || "<none>"}`);
  process.exit(2);
}

const teamQ = teamId ? `&teamId=${teamId}` : "";
const headers = { Authorization: `Bearer ${vercelToken}`, "Content-Type": "application/json" };

function parseEnvFile(content) {
  const entries = [];
  for (const raw of content.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) {
      value = value.slice(1, -1);
    }
    if (value.includes("your-") || value.includes("<TODO")) {
      throw new Error(`${key} still looks like a placeholder — fill it in before syncing`);
    }
    entries.push([key, value]);
  }
  return entries;
}

async function vfetch(url, init) {
  const res = await fetch(url, { ...init, headers: { ...headers, ...(init?.headers ?? {}) } });
  const text = await res.text();
  let body;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!res.ok) throw new Error(`Vercel API ${res.status}: ${typeof body === "object" ? JSON.stringify(body) : body}`);
  return body;
}

const entries = parseEnvFile(readFileSync(envFile, "utf8"));
console.log(`→ syncing ${entries.length} vars from ${envFile} → scope "${scopeKey}" (target=${JSON.stringify(scope.target)})`);

let ok = 0, failed = 0;
for (const [key, value] of entries) {
  try {
    const payload = { key, value, type: "encrypted", target: scope.target };
    if (scope.gitBranch) payload.gitBranch = scope.gitBranch;
    const result = await vfetch(
      `https://api.vercel.com/v10/projects/${projectId}/env?upsert=true${teamQ}`,
      { method: "POST", body: JSON.stringify(payload) },
    );
    const fail = (result.failed ?? [])[0];
    if (fail && !String(fail.error?.message).toLowerCase().includes("already exists")) {
      console.error(`  ✗ ${key}: ${fail.error?.message}`); failed++;
    } else { console.log(`  ✓ ${key}`); ok++; }
  } catch (err) {
    console.error(`  ✗ ${key}: ${err.message}`); failed++;
  }
}
console.log(`\ndone: ${ok} synced, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
