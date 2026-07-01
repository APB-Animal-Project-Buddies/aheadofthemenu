// One-shot transformer: splits "Title — Author" into title + author,
// strips "Vegan/Plant-Based/Vegetarian" prefixes, and appends a
// cuisine-specific cruelty-free descriptor to traditionally meat dishes.
//
// Run: bun recipes/base_document/scripts/clean-titles.ts

import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const DATA_DIR = "/home/shnushnu/Projects/apb-seattle/public/recipes/data";

const CRUELTY_FREE_BY_CUISINE: Record<string, string> = {
  italian: "Senza crudeltà",
  french: "Sans cruauté",
  german: "Tierleidfrei",
  indian: "Kroorta mukt",
  mexican: "Sin crueldad",
  japanese: "Gyakutai nashi",
  thai: "ปราศจากการทารุณกรรม",
  chinese: "Wú nüèdài",
  "middle-eastern": "Bidun qaswa",
  mediterranean: "Chorís sklirótita",
  american: "No Cruelty",
  korean: "동물 학대 없음",
  vietnamese: "Không ngược đãi",
  caribbean: "No Cruelty",
  ethiopian: "Yale gif",
  spanish: "Sin crueldad",
  brazilian: "Sem crueldade",
  "fast-food": "No Cruelty",
};

// Strip these adaptation prefixes from titles. Order matters: longest first.
const STRIP_PREFIXES = [
  /^Best Vegan\s+/i,
  /^Authentic Vegan\s+/i,
  /^Easy Vegan\s+/i,
  /^Classic Vegan\s+/i,
  /^Ultimate Vegan\s+/i,
  /^Plant[-\s]?Based\s+/i,
  /^Vegetarian\s+/i,
  /^Vegan\s+/i,
];

// If the cleaned title (or the original) contains any of these patterns, treat
// the dish as "traditionally meat" and append the cuelty-free descriptor.
const MEAT_PATTERNS: RegExp[] = [
  // raw meat / animal-protein words
  /\b(beef|pork|chicken|lamb|fish|duck|turkey|sausage|brisket|steak|bacon|ham|ribs?|wings?|jerky|mutton|veal|salami|pepperoni|prosciutto|chorizo|kielbasa|bratwurst|hot ?dog|cheeseburger|hamburger|burger|meatball|meatloaf|seafood|shrimp|crab|squid|scallop)\b/i,
  // brand-name fast-food meat items
  /\b(big mac|mcnugget|chick[\s-]?fil[\s-]?a|kfc|crunchwrap supreme|crunchwrap)\b/i,
  // foie/terrine references
  /\b(foie gras|faux gras|terrine|p[âa]t[ée]|confit)\b/i,
  // italian
  /\b(wellington|bourguignon|bistecca|ossobuco|polpette|bolognese|carbonara|cacciatore|saltimbocca)\b/i,
  // french
  /\b(coq au vin|soupe de poisson|cassoulet|boeuf|bœuf|tartare)\b/i,
  // german
  /\b(currywurst|sauerbraten|schnitzel)\b/i,
  // indian
  /\b(rogan josh|vindaloo|butter chicken|tikka|tandoori)\b/i,
  // mexican
  /\b(carnitas|birria|pozole|mole poblano|chilaquiles|tinga|cochinita|barbacoa|asada|al pastor)\b/i,
  // japanese
  /\b(tonkotsu|sukiyaki|yakitori|karaage|katsu|katsudon|gyudon|oyakodon|donburi|yakiniku|shabu|wagyu)\b/i,
  // thai
  /\b(pad thai|pad mee|pad krapow|massaman|crying tiger|suea rong hai|tom yum|larb)\b/i,
  // chinese
  /\b(char siu|kung pao|general tso|mapo|peking duck|xiao long bao|dim sum|fried rice|lo mein|dan dan)\b/i,
  // middle-eastern
  /\b(kibbeh|shawarma|kebab|kofta|shish|maqluba|mansaf)\b/i,
  // mediterranean
  /\b(souvlaki|gyros|moussaka|pastitsio)\b/i,
  // korean
  /\b(bibimbap|bulgogi|galbi|jjigae|japchae|tteokbokki|budae|sundubu|kimchi jjigae|korean bbq)\b/i,
  // vietnamese
  /\b(ph[ơởo]|banh mi|b[áaà]nh m[ìi]|b[uú]n bo|b[uú]n ri[êe]u|b[ơoò] kho|spring rolls|g[ơoỏ]i cu[ơoốộ]n)\b/i,
  // caribbean
  /\b(jerk|pelau|jamaican patties|oxtail|curry goat)\b/i,
  // ethiopian
  /\b(doro wat|tibs)\b/i,
  // brazilian
  /\b(churrasco|picanha|feijoada|coxinha|moqueca|lingui[çc]a)\b/i,
  // spanish / mediterranean meat
  /\b(paella(?! de verduras)|alb[óo]ndigas|chorizo)\b/i,
  // generic
  /\b(hot ?pot|ramen|bbq|barbecue|charcuterie)\b/i,
];

// Naturally vegetarian dishes — never tag, even if they contain meat keywords.
const NEVER_TAG: RegExp[] = [
  /^Hummus\b/i,
  /^Falafel\b/i,
  /^Baba Ganoush\b/i,
  /^Tabbouleh\b/i,
  /^Fattoush\b/i,
  /^Mujadara\b/i,
  /^Stuffed Grape Leaves\b/i,
  /^Dolmades\b/i,
  /^Briam\b/i,
  /^Gigantes Plaki\b/i,
  /^Greek Salad\b/i,
  /^Horiatiki\b/i,
  /^Spanakopita\b/i,
  /^Gazpacho\b/i,
  /^Pan con Tomate\b/i,
  /^Romesco\b/i,
  /^Patatas Bravas\b/i,
  /^(Spanish )?Tortilla Espa[ñn]ola\b/i,
  /^Ratatouille\b/i,
  /^Aloo Gobi\b/i,
  /^Chana Masala\b/i,
  /^Dal Makhani\b/i,
  /^Palak\b/i,
  /^Vegetable\b/i,
  /^Mushroom Risotto\b/i,
  /^Eggplant Parmesan\b/i,
  /^Eggplant Parmigiana\b/i,
  /^Lentil Salad\b/i,
  /^Lentil Bolognese\b/i,
  /^Atakilt Wat\b/i,
  /^Misir Wo?t\b/i,
  /^Kik Alicha\b/i,
  /^Shiro Wo?t\b/i,
  /^Gomen Wat\b/i,
  /^Authentic Injera\b/i,
  /^Injera\b/i,
  /^Brigadeiro\b/i,
  /^P[ãa]o de Queijo\b/i,
  /^Baklava\b/i,
  /^.*Cheesecake\b/i,
  /^Tiramisu\b/i,
  /^French Toast\b/i,
  /^Loukoumades\b/i,
  /^Hotteok\b/i,
  /^Mango Sticky Rice\b/i,
  /^Mango Pudding\b/i,
  /^Ch[èe] Chu[ốo]i\b/i,
  /^Apple Hand[-\s]?Pie\b/i,
  /^Crema Catalana\b/i,
  /^Cr[èeê]me Br[ûu]l[ée]e\b/i,
  /^Cr[èeê]me Caramel\b/i,
  /^Iles Flottantes\b/i,
  /^Floating Islands\b/i,
  /^Gulab Jamun\b/i,
  /^Churros\b/i,
  /^Sweet Potato Pudding\b/i,
  /^.*\bPudding\b/i,
  /^Dabo Kolo\b/i,
  /^Mac\s*&?\s*Cheese\b/i,
  /^Mango Sticky\b/i,
  /^Spring Rolls\b/i,
  /^G[ơoỏ]i Cu[ơoốộ]n\b/i,
  /^French Onion Soup\b/i,
  /^Buffalo Cauliflower\b/i,
  /^Tomato Tarte Tatin\b/i,
  /^Tortilla Soup\b/i,
  /^Lentil\b/i,
  /^Cuban Black Beans\b/i,
  /^Soupe VGE\b/i,
  /^Barbajuans\b/i,
  /^Niçoise Swiss Chard Turnovers\b/i,
  /^Tuscan Gnocchi\b/i,
  /^Vegetable\b/i,
  /^Authentic Paella$/i, // keep paella tagged unless explicitly vegetable
  /^.*Onigiri\b/i, // onigiri are typically seaweed/umeboshi/no-meat in default form
  /^Tofu Tikka\b/i, // user might want this — but tikka is meat. Override: strip handled separately
];

// Override: even if NEVER_TAG matches, if the title still references a strong
// meat-dish (e.g. "Lentil Bolognese"), allow tagging? The user's intent is to
// preserve the meat-imitator framing. We'll trust the user and tag bolognese.
// Easiest: do NOT NEVER_TAG those that contain a strong meat-dish keyword.

const STRONG_MEAT_DISH = /\b(bolognese|wellington|bourguignon|bistecca|carbonara|cacciatore|saltimbocca|rogan josh|tikka|tandoori|sukiyaki|katsu|donburi|bibimbap|bulgogi|galbi|moussaka|shawarma|kebab|kibbeh|jerk|pho|ph[ởơ]|banh mi|b[áaà]nh m[ìi]|b[uú]n bo|b[uú]n ri[êe]u|b[ơoò] kho|coq au vin|sauerbraten|currywurst|carnitas|birria|pozole|chilaquiles|big mac|mcnugget|chick[\s-]?fil[\s-]?a|kfc|crunchwrap|big mac|terrine|faux gras|p[âa]t[ée]|confit|peking|gyros|souvlaki|pastitsio|brisket|wings?|burger|meatloaf|meatball|sausage|kung pao|char siu|general tso|mapo|currywurst|wellington|cassoulet)\b/i;

function splitTitle(rawTitle: string): { name: string; author: string } {
  // Split on em/en dash with surrounding whitespace; "—" first occurrence.
  const m = rawTitle.match(/^(.*?)\s+[—–]\s+(.+)$/);
  if (m) {
    return { name: m[1].trim(), author: m[2].trim() };
  }
  return { name: rawTitle.trim(), author: "" };
}

function stripVeganPrefix(name: string): string {
  let out = name;
  for (const re of STRIP_PREFIXES) {
    if (re.test(out)) {
      out = out.replace(re, "");
      break;
    }
  }
  return out.trim();
}

function shouldTag(name: string, originallyHadVeganPrefix: boolean): boolean {
  if (STRONG_MEAT_DISH.test(name)) return true;
  for (const re of NEVER_TAG) {
    if (re.test(name)) return false;
  }
  for (const re of MEAT_PATTERNS) {
    if (re.test(name)) return true;
  }
  // If it had a "Vegan" prefix and we stripped it, default to tagging — the
  // prefix only gets added when adapting from a non-vegan original.
  return originallyHadVeganPrefix;
}

function descriptorFor(cuisine: string): string {
  return CRUELTY_FREE_BY_CUISINE[cuisine] || "No Cruelty";
}

function transformOne(rec: any): { changed: boolean } {
  if (!rec || typeof rec.title !== "string") return { changed: false };
  const original = rec.title;

  const { name: rawName, author } = splitTitle(original);

  const hadVeganPrefix = STRIP_PREFIXES.some((re) => re.test(rawName));
  const cleanName = stripVeganPrefix(rawName);

  // Skip non-recipe entries (foodservice summary, etc.)
  if (!rec.cuisine || rec.urlStatus === "reference-document") {
    rec.title = cleanName;
    if (author) rec.author = author;
    return { changed: original !== rec.title || !!author };
  }

  let finalName = cleanName;

  // Avoid double-appending if descriptor already present in any language.
  const alreadyHasDescriptor = /\(\s*(senza crudelt[àa]|sans cruaut[ée]|tierleidfrei|kroorta mukt|sin crueldad|gyakutai nashi|ปราศจากการทารุณกรรม|w[uú] n[uü][èe]d[àa]i|bidun qaswa|chor[ií]s sklir[óo]tita|no cruelty|동물 학대 없음|kh[ơoô]ng ng[ưu][ơoợ]c [đd][ãa]i|yale gif|sem crueldade)\s*\)/i.test(
    finalName,
  );

  if (!alreadyHasDescriptor && shouldTag(cleanName, hadVeganPrefix)) {
    finalName = `${cleanName} (${descriptorFor(rec.cuisine)})`;
  }

  rec.title = finalName;
  if (author) rec.author = author;

  return { changed: original !== finalName || !!author };
}

function regenerateJs(jsonPath: string, jsPath: string, recipes: any[]): string {
  // Read original .js to preserve the leading wrapper line.
  // Format is: header line, push(...[ ARRAY ]);
  const indented = JSON.stringify(recipes, null, 2)
    .split("\n")
    .map((l) => "  " + l)
    .join("\n")
    .replace(/^  \[/, "[")
    .replace(/\n  \]$/, "\n]");
  return `// Auto-generated from vegan-restaurant-catalog-v5.md — do not edit by hand.\n(window.APB_RECIPES = window.APB_RECIPES || []).push(...${indented});\n`;
}

async function processFile(jsonPath: string, jsPath: string | null): Promise<number> {
  const raw = await readFile(jsonPath, "utf8");
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) return 0;

  let changed = 0;
  for (const rec of data) {
    if (transformOne(rec).changed) changed++;
  }

  // Write JSON pretty-printed (match existing 2-space indent).
  await writeFile(jsonPath, JSON.stringify(data, null, 2) + "\n");

  if (jsPath) {
    await writeFile(jsPath, regenerateJs(jsonPath, jsPath, data));
  }

  return changed;
}

async function main() {
  const files = await readdir(DATA_DIR);
  const jsonFiles = files
    .filter((f) => f.endsWith(".json"))
    .filter((f) => !f.startsWith("_")); // skip _index.json, _tips.json, _dairy.json

  let totalChanged = 0;
  for (const f of jsonFiles) {
    const jsonPath = join(DATA_DIR, f);
    const jsName = f.replace(/\.json$/, ".js");
    const jsPath = files.includes(jsName) ? join(DATA_DIR, jsName) : null;
    const n = await processFile(jsonPath, jsPath);
    totalChanged += n;
    console.log(`${f}: ${n} recipes updated`);
  }
  console.log(`\nDone. Total recipes updated: ${totalChanged}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
