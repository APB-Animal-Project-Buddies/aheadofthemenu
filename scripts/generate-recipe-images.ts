#!/usr/bin/env bun
/**
 * Generate AI recipe images via Gemini 2.5 Flash Image.
 *
 * Usage:
 *   bun run scripts/generate-recipe-images.ts                    # full corpus
 *   bun run scripts/generate-recipe-images.ts --sample 5         # 5 random recipes
 *   bun run scripts/generate-recipe-images.ts --cuisine korean   # one cuisine
 *   bun run scripts/generate-recipe-images.ts --force <id>       # regen one recipe
 *   bun run scripts/generate-recipe-images.ts --force-all        # wipe & regen
 *   bun run scripts/generate-recipe-images.ts --dry-run          # print prompts only
 *
 * Requires GEMINI_API_KEY in .env (Bun auto-loads).
 */

import { existsSync, mkdirSync, readdirSync, unlinkSync, statSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { generateImage, GeminiImageError } from "./lib/gemini-image";
import { buildPrompt, type Recipe } from "./lib/recipe-prompt";
import { loadAllRecipes, IMAGES_DIR } from "./lib/load-recipes";

const TARGET_W = 1024;
const TARGET_H = 768;
const TARGET_QUALITY = 82;
const FALLBACK_QUALITY = 70;
const SOFT_LIMIT_BYTES = 200 * 1024; // 200 KB → step down to fallback q
const HARD_CAP_BYTES = 500 * 1024; //   500 KB → fail
const CONCURRENCY = 4;
const COST_BUDGET_USD = 15;
const COST_PER_IMAGE_USD = 0.039;
const MANIFEST_PATH = join(IMAGES_DIR, "_manifest.json");
const FAILURES_PATH = join(IMAGES_DIR, "_failures.json");

interface Args {
  sample?: number;
  cuisine?: string;
  forceId?: string;
  forceAll: boolean;
  dryRun: boolean;
}

function parseArgs(argv: string[]): Args {
  const a: Args = { forceAll: false, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const v = argv[i];
    if (v === "--sample") a.sample = Number(argv[++i]);
    else if (v === "--cuisine") a.cuisine = argv[++i];
    else if (v === "--force") a.forceId = argv[++i];
    else if (v === "--force-all") a.forceAll = true;
    else if (v === "--dry-run") a.dryRun = true;
    else if (v === "--help") {
      console.log(
        "usage: bun run scripts/generate-recipe-images.ts [--sample N] [--cuisine <slug>] [--force <id>] [--force-all] [--dry-run]"
      );
      process.exit(0);
    }
  }
  return a;
}

interface ManifestEntry {
  id: string;
  cuisine: string;
  prompt: string;
  model: string;
  generatedAt: string;
  bytes: number;
  webpQuality: number;
}

async function loadJson<T>(path: string, fallback: T): Promise<T> {
  if (!existsSync(path)) return fallback;
  const text = await Bun.file(path).text();
  if (!text.trim()) return fallback;
  return JSON.parse(text) as T;
}

async function writeJson(path: string, data: unknown) {
  await Bun.write(path, JSON.stringify(data, null, 2) + "\n");
}

function selectRecipes(all: Recipe[], args: Args): Recipe[] {
  let pool = all;
  if (args.cuisine) pool = pool.filter((r) => r.cuisine === args.cuisine);
  if (args.forceId) {
    const r = pool.find((x) => x.id === args.forceId);
    if (!r) {
      console.error(`No recipe found with id=${args.forceId}`);
      process.exit(1);
    }
    return [r];
  }
  if (args.sample) {
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, args.sample);
  }
  return pool;
}

async function encodeWebp(srcBytes: Uint8Array, recipeId: string): Promise<{ bytes: Buffer; quality: number }> {
  const base = sharp(Buffer.from(srcBytes)).resize(TARGET_W, TARGET_H, { fit: "cover", position: "centre" });
  let quality = TARGET_QUALITY;
  let out = await base.clone().webp({ quality, effort: 5 }).toBuffer();

  if (out.byteLength > SOFT_LIMIT_BYTES) {
    quality = FALLBACK_QUALITY;
    out = await base.clone().webp({ quality, effort: 5 }).toBuffer();
  }
  if (out.byteLength > HARD_CAP_BYTES) {
    throw new Error(
      `Image for ${recipeId} exceeds 500 KB hard cap (got ${(out.byteLength / 1024).toFixed(0)} KB)`
    );
  }
  return { bytes: out, quality };
}

async function generateOne(recipe: Recipe, args: Args, manifest: ManifestEntry[]): Promise<ManifestEntry | null> {
  const outPath = join(IMAGES_DIR, `${recipe.id}.webp`);
  if (!args.forceAll && !args.forceId && existsSync(outPath)) {
    return null; // skip — already generated
  }

  const prompt = buildPrompt(recipe);
  if (args.dryRun) {
    console.log(`\n--- ${recipe.id} (${recipe.cuisine}) ---\n${prompt}`);
    return null;
  }

  const { bytes, mimeType } = await generateImage(prompt);
  console.log(`  ${recipe.id} ← ${(bytes.byteLength / 1024).toFixed(0)} KB ${mimeType}`);

  const { bytes: webpBytes, quality } = await encodeWebp(bytes, recipe.id);
  await Bun.write(outPath, webpBytes);

  const entry: ManifestEntry = {
    id: recipe.id,
    cuisine: recipe.cuisine,
    prompt,
    model: process.env.GEMINI_IMAGE_MODEL ?? "gemini-2.5-flash-image",
    generatedAt: new Date().toISOString(),
    bytes: webpBytes.byteLength,
    webpQuality: quality,
  };
  // Replace any prior entry for this id
  const idx = manifest.findIndex((m) => m.id === recipe.id);
  if (idx >= 0) manifest[idx] = entry;
  else manifest.push(entry);
  return entry;
}

async function runWithConcurrency<T, R>(items: T[], n: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  let cursor = 0;
  const workers = Array.from({ length: Math.min(n, items.length) }, async () => {
    while (cursor < items.length) {
      const idx = cursor++;
      results[idx] = await fn(items[idx]);
    }
  });
  await Promise.all(workers);
  return results;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!existsSync(IMAGES_DIR)) mkdirSync(IMAGES_DIR, { recursive: true });

  if (args.forceAll && !args.dryRun) {
    for (const f of readdirSync(IMAGES_DIR)) {
      if (f.endsWith(".webp")) unlinkSync(join(IMAGES_DIR, f));
    }
    console.log("--force-all: cleared existing images");
  }

  const all = await loadAllRecipes();
  const targets = selectRecipes(all, args);

  // Cost guard
  const expectedCost = targets.length * COST_PER_IMAGE_USD;
  if (expectedCost > COST_BUDGET_USD && !args.dryRun) {
    console.error(
      `Aborting: ${targets.length} recipes × $${COST_PER_IMAGE_USD} = $${expectedCost.toFixed(2)} ` +
        `exceeds $${COST_BUDGET_USD} budget. Use --sample to scope down.`
    );
    process.exit(2);
  }

  console.log(
    `Generating ${targets.length} image(s)${args.dryRun ? " (dry-run)" : ""}, ` +
      `est. cost $${expectedCost.toFixed(2)}, concurrency=${CONCURRENCY}`
  );

  const manifest = await loadJson<ManifestEntry[]>(MANIFEST_PATH, []);
  const failures: Array<{ id: string; error: string }> = [];

  let done = 0;
  await runWithConcurrency(targets, CONCURRENCY, async (recipe) => {
    try {
      await generateOne(recipe, args, manifest);
      done++;
    } catch (err) {
      const msg = err instanceof GeminiImageError ? `[${err.status}] ${err.message}` : (err as Error).message;
      console.error(`  FAIL ${recipe.id}: ${msg}`);
      failures.push({ id: recipe.id, error: msg });
    }
  });

  if (!args.dryRun) {
    await writeJson(MANIFEST_PATH, manifest);
    if (failures.length) await writeJson(FAILURES_PATH, failures);
    else if (existsSync(FAILURES_PATH)) unlinkSync(FAILURES_PATH);
  }

  const totalSize = readdirSync(IMAGES_DIR)
    .filter((f) => f.endsWith(".webp"))
    .reduce((acc, f) => acc + statSync(join(IMAGES_DIR, f)).size, 0);

  console.log(
    `\nDone. ${done} generated, ${failures.length} failed. ` +
      `Directory: ${(totalSize / (1024 * 1024)).toFixed(1)} MB total.`
  );
  if (failures.length) {
    console.log(`Retry failures with: bun run scripts/generate-recipe-images.ts --force <id>`);
    process.exit(3);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
