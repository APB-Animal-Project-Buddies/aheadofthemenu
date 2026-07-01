#!/usr/bin/env bun
/**
 * Patch recipe JSON files with `image` field pointing at generated WebPs.
 *
 * Idempotent: only adds/refreshes `image` if a `.webp` exists at
 * `public/recipes/images/<id>.webp`. Recipes without a generated image
 * keep falling back to the PhotoPH placeholder in the UI.
 *
 * Usage:
 *   bun run scripts/wire-recipe-images.ts          # wire all
 *   bun run scripts/wire-recipe-images.ts --check  # report only, no writes
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import { loadAllRecipeFiles, writeRecipeFile, IMAGES_DIR } from "./lib/load-recipes";

async function main() {
  const checkOnly = process.argv.includes("--check");
  const files = await loadAllRecipeFiles();

  let written = 0;
  let added = 0;
  let updated = 0;
  let cleared = 0;
  let missing = 0;

  for (const f of files) {
    let dirty = false;
    for (const r of f.recipes) {
      const webp = join(IMAGES_DIR, `${r.id}.webp`);
      const expected = `/recipes/images/${r.id}.webp`;
      if (existsSync(webp)) {
        if (r.image === expected) continue;
        if (r.image == null) added++;
        else updated++;
        r.image = expected;
        dirty = true;
      } else {
        if (r.image != null) {
          delete r.image;
          cleared++;
          dirty = true;
        }
        missing++;
      }
    }
    if (dirty && !checkOnly) {
      await writeRecipeFile(f.path, f.recipes);
      written++;
    }
  }

  console.log(
    `${checkOnly ? "[check] " : ""}files=${files.length} written=${written} ` +
      `added=${added} updated=${updated} cleared=${cleared} no-image=${missing}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
