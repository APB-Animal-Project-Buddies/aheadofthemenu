import { readdirSync } from "node:fs";
import { join, basename } from "node:path";
import type { Recipe } from "./recipe-prompt.ts";

export const DATA_DIR = "public/recipes/data";
export const IMAGES_DIR = "public/recipes/images";

export interface LoadedFile {
  /** absolute or repo-relative path */
  path: string;
  /** cuisine slug derived from filename, e.g. "korean" from "korean.json" */
  cuisine: string;
  recipes: Recipe[];
}

/**
 * Discover all recipe JSON files in DATA_DIR, skipping metadata files
 * (filenames starting with `_`, e.g. `_index.json`, `_dairy.json`, `_tips.json`).
 */
export async function loadAllRecipeFiles(): Promise<LoadedFile[]> {
  const files = readdirSync(DATA_DIR)
    .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
    .sort();

  const out: LoadedFile[] = [];
  for (const f of files) {
    const path = join(DATA_DIR, f);
    const cuisine = basename(f, ".json");
    const text = await Bun.file(path).text();
    const recipes = JSON.parse(text) as Recipe[];
    out.push({ path, cuisine, recipes });
  }
  return out;
}

export async function loadAllRecipes(): Promise<Recipe[]> {
  const files = await loadAllRecipeFiles();
  return files.flatMap((f) => f.recipes);
}

/**
 * Write a recipe array back to its JSON file with stable formatting.
 * Pretty-printed (2-space indent) + trailing newline to match the existing files.
 */
export async function writeRecipeFile(path: string, recipes: Recipe[]): Promise<void> {
  const text = JSON.stringify(recipes, null, 2) + "\n";
  await Bun.write(path, text);
}
