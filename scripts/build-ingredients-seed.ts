// One-time: transform the OFF taxonomy into a trimmed seed committed to the repo.
// Usage: bun scripts/build-ingredients-seed.ts /tmp/off_ingredients.full.json
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";

const src = process.argv[2] ?? "/tmp/off_ingredients.full.json";
const tax = JSON.parse(readFileSync(src, "utf8")) as Record<string, any>;

const rows = Object.entries(tax)
  .filter(([, e]) => e?.name?.en)
  .map(([id, e]) => {
    const veganRaw = e?.vegan?.en;
    const vegan = veganRaw === "yes" ? true : veganRaw === "no" ? false : null;
    const synonyms: string[] = Array.isArray(e?.synonyms?.en)
      ? e.synonyms.en.filter((s: unknown): s is string => typeof s === "string")
      : [];
    return { id, name: String(e.name.en), synonyms, vegan, off_id: id };
  });

mkdirSync("scripts/data", { recursive: true });
writeFileSync("scripts/data/ingredients-seed.json", JSON.stringify(rows));
console.log(`Wrote ${rows.length} ingredients to scripts/data/ingredients-seed.json`);
