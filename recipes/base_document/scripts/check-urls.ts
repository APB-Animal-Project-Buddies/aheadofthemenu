#!/usr/bin/env bun
// Liveness-checks every URL in the parsed recipe data.
// Reports dead URLs (>= 400 status or unreachable).
//
// Usage: bun recipes/base_document/scripts/check-urls.ts
//        bun recipes/base_document/scripts/check-urls.ts --concurrency=20

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dir, "..", "..", "..");
const DATA_DIR = join(ROOT, "public", "recipes", "data");
const REPORT_PATH = join(ROOT, "recipes", "base_document", "url-liveness-report.json");

const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const TIMEOUT_MS = 8000;
const CONCURRENCY = parseInt(
  (process.argv.find(a => a.startsWith("--concurrency="))?.split("=")[1]) || "10",
  10,
);

interface Entry { id: string; title: string; cuisine: string; url: string; }
interface Result extends Entry { status: number; alive: boolean; finalUrl?: string; error?: string; }

const all: Entry[] = [];
for (const f of readdirSync(DATA_DIR)) {
  if (!f.endsWith(".json") || f.startsWith("_")) continue;
  const list = JSON.parse(readFileSync(join(DATA_DIR, f), "utf8"));
  for (const r of list) {
    if (r.url) all.push({ id: r.id, title: r.title, cuisine: r.cuisine, url: r.url });
  }
}

console.log(`Checking ${all.length} URLs (concurrency=${CONCURRENCY})…\n`);

async function check(e: Entry): Promise<Result> {
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    // HEAD first; some servers return 405/404 on HEAD but 200 on GET. Fall back to GET.
    let resp = await fetch(e.url, { method: "HEAD", redirect: "follow", signal: ctrl.signal, headers: { "User-Agent": UA, "Accept": "text/html,*/*" } });
    if (resp.status === 405 || resp.status === 404) {
      resp = await fetch(e.url, { method: "GET", redirect: "follow", signal: ctrl.signal, headers: { "User-Agent": UA, "Accept": "text/html,*/*" } });
    }
    clearTimeout(timeout);
    return { ...e, status: resp.status, alive: resp.status < 400, finalUrl: resp.url !== e.url ? resp.url : undefined };
  } catch (err: any) {
    clearTimeout(timeout);
    return { ...e, status: 0, alive: false, error: err?.message || String(err) };
  }
}

async function pool(items: Entry[]): Promise<Result[]> {
  const out: Result[] = [];
  let cursor = 0;
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (cursor < items.length) {
      const idx = cursor++;
      const r = await check(items[idx]);
      out[idx] = r;
      const mark = r.alive ? "✓" : "✗";
      const stat = r.error ? "ERR" : r.status;
      process.stdout.write(`${mark} ${String(stat).padEnd(4)} ${r.cuisine.padEnd(15)} ${r.title}\n`);
    }
  });
  await Promise.all(workers);
  return out;
}

async function main() {
  const results = await pool(all);
  const dead = results.filter(r => !r.alive);
  const alive = results.filter(r => r.alive);

  console.log();
  console.log(`Alive: ${alive.length} / ${results.length}`);
  console.log(`Dead:  ${dead.length} / ${results.length}`);

  writeFileSync(REPORT_PATH, JSON.stringify({
    checkedAt: new Date().toISOString(),
    total: results.length,
    alive: alive.length,
    dead: dead.length,
    deadList: dead.map(d => ({ id: d.id, title: d.title, cuisine: d.cuisine, url: d.url, status: d.status, error: d.error })),
  }, null, 2));

  console.log(`\nReport written to ${REPORT_PATH}`);
}

main();
