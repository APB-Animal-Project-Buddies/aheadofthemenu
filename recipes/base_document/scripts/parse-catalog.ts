#!/usr/bin/env bun
// Parses vegan-restaurant-catalog-v5.md into per-cuisine JSON files for /recipes.
//
// Input:  recipes/base_document/vegan-restaurant-catalog-v5.md
// Output: public/recipes/data/<cuisine-slug>.json (one file per cuisine)
//         public/recipes/data/_index.json (cuisine list + counts + metadata)
//
// Usage:  bun recipes/base_document/scripts/parse-catalog.ts

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dir, "..", "..", "..");
const SRC = join(ROOT, "recipes", "base_document", "vegan-restaurant-catalog-v5.md");
const OVERRIDES_PATH = join(ROOT, "recipes", "base_document", "url_overrides.json");
const DESC_OVERRIDES_PATH = join(ROOT, "recipes", "base_document", "description_overrides.json");
const TIP_OVERRIDES_PATH = join(ROOT, "recipes", "base_document", "tip_overrides.json");
const TIP_ADDITIONS_PATH = join(ROOT, "recipes", "base_document", "tip_additions.json");
const ALT_OVERRIDES_PATH = join(ROOT, "recipes", "base_document", "alternatives_overrides.json");
const RECIPE_OVERRIDES_PATH = join(ROOT, "recipes", "base_document", "recipe_overrides.json");
const OUT_DIR = join(ROOT, "public", "recipes", "data");

type UrlStatus = "verified" | "reference-vegan" | "reference-technique" | "unknown";
type Tier = "in-house" | "branded" | "hybrid";
type Course = "starter" | "main" | "showstopper" | "dessert";
type Photo = "bowl" | "plate" | "flat" | "layered";

interface Sub { from: string; effect: string; delta: string; }
interface Alternative { url: string; source: string; note: string; }

interface Recipe {
  id: string;
  title: string;            // cleaned, no course markers, no brand parens
  source: string | null;    // author / site attribution lifted from the title (e.g. "Gauthier", "Rainbow Plant Life")
  rawTitle: string;         // original H3 line
  rawBody: string;          // full markdown body between this H3 and the next section break
  valueRatio: number | null;// menu_price_mid / food_cost — return on food spend
  valueTier: string | null; // "Margin King" | "Strong Earner" | "Solid" | "Showpiece"
  cuisine: string;          // slug
  cuisineName: string;
  courses: Course[];
  url: string | null;
  urlStatus: UrlStatus;
  urlNote: string | null;   // inline italic note after the status marker
  description: string;
  cost: number | null;      // wholesale food cost per serving
  menuPrice: string | null;
  weight: string | null;
  calories: number | null;
  protein: string | null;
  time: string | null;      // e.g. "30m", "90m", "4h"
  prep: string | null;      // alias for time (legacy schema compat)
  servings: number | null;
  serves: number | null;    // alias (legacy schema compat)
  difficulty: 1 | 2 | 3 | null;
  difficultyLabel: string | null;
  difficultyNote: string | null;
  tags: ("bulk-prep" | "fast-service")[];
  sourcingTier: Tier;
  subs: Sub[];
  alternatives: Alternative[];
  photo: Photo;
  photoLabel: string;
  badge: string | null;     // derived: "Showpiece" | "Bistro classic" | etc. for visual variety
}

// ---------- Cuisine map: catalog-name → slug + display name ----------
const CUISINE_MAP: Record<string, { slug: string; name: string }> = {
  "American":            { slug: "american",       name: "American" },
  "Indian":              { slug: "indian",         name: "Indian" },
  "French":              { slug: "french",         name: "French" },
  "Italian":             { slug: "italian",        name: "Italian" },
  "Ethiopian":           { slug: "ethiopian",      name: "Ethiopian" },
  "Fast-Food Copycats":  { slug: "fast-food",      name: "Fast-Food" },
  "Mexican":             { slug: "mexican",        name: "Mexican" },
  "Japanese":            { slug: "japanese",       name: "Japanese" },
  "Thai":                { slug: "thai",           name: "Thai" },
  "Chinese":             { slug: "chinese",        name: "Chinese" },
  "Middle Eastern":      { slug: "middle-eastern", name: "Middle Eastern" },
  "Mediterranean":       { slug: "mediterranean",  name: "Mediterranean" },
  "Korean":              { slug: "korean",         name: "Korean" },
  "Vietnamese":          { slug: "vietnamese",     name: "Vietnamese" },
  "Caribbean":           { slug: "caribbean",      name: "Caribbean" },
  "Spanish":             { slug: "spanish",        name: "Spanish" },
  "Brazilian (NEW SECTION)": { slug: "brazilian",  name: "Brazilian" },
  "Brazilian":           { slug: "brazilian",      name: "Brazilian" },
};

// ---------- Sourcing tier overrides (from md's Sourcing Tier Index) ----------
// Match against the cleaned title — partial substring is enough.
const BRANDED_TITLES = new Set([
  "Impossible Meatloaf",
  "Vegan Beef Wellington",
  "Vegan Bistecca alla Fiorentina",
  "Vegan Crying Tiger",
  "Suea Rong Hai",
  "Vegan Bò Kho",
  "Vegan Jerk Chunk Steak Platter",
  "Vegan Picanha",
  "Vegan Churrasco",
  "Vegan Feijoada",
]);
const HYBRID_TITLES = new Set([
  "Vegan Big Mac",
  "Vegan Crunchwrap Supreme",
]);

// Map URL host → canonical author/site display name.
const HOST_TO_SOURCE: Record<string, string> = {
  "noracooks.com": "Nora Cooks",
  "holycowvegan.net": "Holy Cow Vegan",
  "veganricha.com": "Vegan Richa",
  "rainbowplantlife.com": "Rainbow Plant Life",
  "minimalistbaker.com": "Minimalist Baker",
  "cookieandkate.com": "Cookie and Kate",
  "loveandlemons.com": "Love and Lemons",
  "thevietvegan.com": "The Viet Vegan",
  "okonomikitchen.com": "Okonomi Kitchen",
  "themediterraneandish.com": "The Mediterranean Dish",
  "daringgourmet.com": "Daring Gourmet",
  "recipetineats.com": "RecipeTin Eats",
  "lazycatkitchen.com": "Lazy Cat Kitchen",
  "biancazapatka.com": "Bianca Zapatka",
  "schoolnightvegan.com": "School Night Vegan",
  "thekoreanvegan.com": "The Korean Vegan",
  "thefieryvegetarian.com": "The Fiery Vegetarian",
  "vegancocotte.com": "Vegan Cocotte",
  "vegnews.com": "VegNews",
  "thenewbaguette.com": "The New Baguette",
  "saltedplains.com": "Salted Plains",
  "veggiekinsblog.com": "Veggiekins",
  "feastingathome.com": "Feasting At Home",
  "lovingitvegan.com": "Loving It Vegan",
  "dorastable.com": "Dora's Table",
  "brokebankvegan.com": "Broke Bank Vegan",
  "mexicanmademeatless.com": "Mexican Made Meatless",
  "thatgirlcookshealthy.com": "That Girl Cooks Healthy",
  "cookingwithria.com": "Cooking With Ria",
  "makeitdairyfree.com": "Make It Dairy Free",
  "sweetpotatosoul.com": "Sweet Potato Soul",
  "healthiersteps.com": "Healthier Steps",
  "fooby.ch": "Fooby",
  "thespanishradish.com": "The Spanish Radish",
  "simpleveganblog.com": "Simple Vegan Blog",
  "edgyveg.com": "The Edgy Veg",
  "theedgyveg.com": "The Edgy Veg",
  "pickledplum.com": "Pickled Plum",
  "omnivorescookbook.com": "Omnivore's Cookbook",
  "wokoflife.com": "The Woks of Life",
  "thewoksoflife.com": "The Woks of Life",
  "justonecookbook.com": "Just One Cookbook",
  "veggieanh.com": "Veggie Anh",
  "sarahsvegankitchen.com": "Sarah's Vegan Kitchen",
  "girlmeetsradish.com": "Girl Meets Radish",
  "hot-thai-kitchen.com": "Hot Thai Kitchen",
  "thefoodietakesflight.com": "The Foodie Takes Flight",
  "sixhungryfeet.com": "Six Hungry Feet",
  "urbanfarmie.com": "Urban Farmie",
  "foreignfork.com": "The Foreign Fork",
  "alexisgauthier.com": "Alexis Gauthier",
  "juicymarbles.com": "Juicy Marbles",
  "theeburgerdude.com": "The Burger Dude",
  "anediblemosaic.com": "An Edible Mosaic",
  "gazoakleychef.com": "Gaz Oakley",
  "veganeating.com": "Vegan Eating",
  "vegankitchenmagick.com": "Vegan Kitchen Magick",
  "pipingpotcurry.com": "Piping Pot Curry",
  "isachandra.com": "Isa Chandra Moskowitz",
  "dianekochilas.com": "Diane Kochilas",
  "barbecuebible.com": "Barbecue Bible",
  "braziliankitchenabroad.com": "Brazilian Kitchen Abroad",
  "karissasvegankitchen.com": "Karissa's Vegan Kitchen",
  "cookingwithjade.com": "Cooking with Jade",
  "piesandtacos.com": "Pies and Tacos",
  "cookwithmanali.com": "Cook With Manali",
  "itdoesnttastelikechicken.com": "It Doesn't Taste Like Chicken",
  "addictedtodates.com": "Addicted to Dates",
  "connoisseurusveg.com": "Connoisseurus Veg",
  "cooking.nytimes.com": "NYT Cooking",
  "thegreedyvegan.com": "The Greedy Vegan",
};

function sourceFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    return HOST_TO_SOURCE[host] || null;
  } catch {
    return null;
  }
}

// ---------- Helpers ----------
function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[''`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function parseCourses(rawTitle: string): Course[] {
  // Find content between the **bold** markers inside parens
  const out: Course[] = [];
  const m = rawTitle.match(/\*\*([^*]+)\*\*/g) || [];
  const tokens = m
    .map((s: string) => s.replace(/\*\*/g, "").toUpperCase())
    .flatMap((s: string) => s.split(/[\/—,]/))
    .map((s: string) => s.trim());
  for (const t of tokens) {
    if (t.startsWith("STARTER")) out.push("starter");
    else if (t.startsWith("MAIN")) out.push("main");
    else if (t.startsWith("SHOWSTOPPER")) out.push("showstopper");
    else if (t.startsWith("DESSERT")) out.push("dessert");
    else if (t.startsWith("SNACK")) {/* ignore */}
  }
  return out.length ? Array.from(new Set(out)) : ["main"];
}

function cleanTitle(rawTitle: string): { title: string; source: string | null } {
  // Strip leading "### "
  let t = rawTitle.replace(/^#+\s*/, "").trim();
  // Strip the " (**...**)"-style course markers
  t = t.replace(/\s*\(\*\*[^)]*\*\*[^)]*\)/g, "");

  let source: string | null = null;

  // Trailing em-dash author/source: " — Gauthier", " — Rainbow Plant Life", " — The Korean Vegan"
  // Em-dash is the only reliable indicator of authorship in the catalog.
  // Parentheticals are reserved for descriptors / cruelty-free phrases.
  const dash = t.match(/\s+—\s+(.+?)\s*$/);
  if (dash) {
    source = dash[1].trim();
    t = t.replace(/\s+—\s+.+?\s*$/, "");
  }

  return { title: t.trim(), source };
}

// Map cuisine slug → cruelty-free phrase to use in titles.
const CUISINE_CRUELTY_FREE: Record<string, string> = {
  american:        "No Cruelty",
  italian:         "Senza crudeltà",
  french:          "Sans cruauté",
  indian:          "बिना हिंसा · Bina hinsa",
  mexican:         "Sin crueldad",
  japanese:        "虐待のない · Gyakutai no nai",
  thai:            "ไร้ความโหดร้าย",
  chinese:         "零残忍 · Líng cánrěn",
  "middle-eastern": "بدون قسوة · Bidoun qaswa",
  mediterranean:   "Sense crueltat",
  korean:          "학대 없는 · Hakdae eomneun",
  vietnamese:      "Không tàn nhẫn",
  caribbean:       "Cruelty-free",
  ethiopian:       "ያለ ጭካኔ · Yale chikane",
  spanish:         "Sin crueldad",
  "fast-food":     "No Cruelty",
  brazilian:       "Sem crueldade",
};

// Replace "Vegan X" with "X (cuisine cruelty-free phrase)".
// If the title already ends with a non-Latin parenthetical (e.g. existing cruelty-free phrase
// like "(학대 없는)"), leave it alone.
function transformVeganTitle(title: string, cuisineSlug: string): string {
  const phrase = CUISINE_CRUELTY_FREE[cuisineSlug];
  if (!phrase) return title;

  let t = title;
  if (/^Vegan\s+/i.test(t)) {
    t = t.replace(/^Vegan\s+/i, "");
  } else {
    return title;  // not a "Vegan X" title; leave untouched
  }

  // Trailing parenthetical?
  const m = t.match(/\s*\(([^)]+)\)\s*$/);
  if (m) {
    const inner = m[1];
    // Non-ASCII or contains clear cruelty-free token → it's already a cruelty-free phrase, keep
    if (/[^\x00-\x7F]/.test(inner) || /(crueldad|crueldade|cruelt[àyé]|crueauté|crueauté|crueauté|tierleidfrei|cruelty)/i.test(inner)) {
      return t;
    }
    // Latin English/etc. descriptor like "(Brazilian Cheese Bread)", "(red lentil stew)" → strip
    t = t.replace(/\s*\([^)]+\)\s*$/, "");
  }

  return `${t} (${phrase})`;
}

function parseUrlLine(line: string): { url: string | null; status: UrlStatus; note: string | null } {
  // Catalog uses several URL prefixes. We pick the FIRST URL on the line.
  //   - **URL:** https://...                                  (canonical)
  //   - **Source URL:** https://... (also https://...)        (Brazilian variant)
  //   - **Source / inspiration URL:** https://... ⚠ REFERENCE (Brazilian non-vegan technique)
  const urlMatch = line.match(/https?:\/\/[^\s)]+/);
  const url = urlMatch ? urlMatch[0].replace(/[).,;]+$/, "") : null;
  let status: UrlStatus = "unknown";
  if (/✓\s*VERIFIED/i.test(line)) status = "verified";
  else if (/⚠\s*REFERENCE\s*\(vegan/i.test(line)) status = "reference-vegan";
  else if (/⚠\s*REFERENCE\s*\(non-vegan/i.test(line)) status = "reference-technique";
  // Heuristic: if URL exists but no status marker, it's likely an unannotated source.
  // Treat as "verified" so it's surfaced; the catalog implies these are working URLs.
  if (url && status === "unknown") status = "verified";
  const noteMatch = line.match(/\*\(([^)]+)\)\*/);
  const note = noteMatch ? noteMatch[1].trim() : null;
  return { url, status, note };
}

// ---------- Compact-format line parser ----------
// Korean and some other recipes use a one-line compact format:
//   - $3.10/serving · **Menu price:** $15–19 · 480 g · 580 cal · 22 g · 60 min · 4 · **Hard** (note) · 🥘 ⚡
// Returns the partial recipe fields it could extract.
function parseCompactStatsLine(line: string): Partial<Recipe> | null {
  // Trigger: either a "$X/serving" token (cost+stats) OR a "Ng · Ncal" token (stats-only line).
  if (!/\$[\d.]+\s*\/\s*serving/i.test(line) && !/\d+\s*g\s*·\s*\d+\s*cal/i.test(line)) return null;
  const out: Partial<Recipe> = {};
  // Strip leading bullet
  const body = line.replace(/^\s*-\s*/, "");
  const parts = body.split(/\s*·\s*/);

  let weightSeen = false;
  for (const part of parts) {
    const p = part.trim();
    if (!p) continue;
    let m: RegExpMatchArray | null;

    if ((m = p.match(/\$([\d.]+)\s*\/\s*serving/i))) {
      out.cost = parseFloat(m[1]);
    } else if (/Menu price:/i.test(p)) {
      out.menuPrice = p.replace(/.*Menu price:\*\*\s*/i, "").trim() || null;
    } else if ((m = p.match(/^(\d+(?:\.\d+)?)\s*g\b/))) {
      // First "Ng" is weight, second is protein
      if (!weightSeen) { out.weight = `${m[1]} g`; weightSeen = true; }
      else { out.protein = `${m[1]} g`; }
    } else if ((m = p.match(/^(\d+(?:,\d+)?)\s*cal\b/i))) {
      out.calories = parseInt(m[1].replace(/,/g, ""), 10);
    } else if ((m = p.match(/(\d+)\s*(?:min|minutes)\b/i))) {
      out.time = `${m[1]}m`;
      out.prep = out.time;
    } else if ((m = p.match(/(\d+)\s*\+?\s*(?:hr|hours|h)\b/i))) {
      out.time = `${m[1]}h`;
      out.prep = out.time;
    } else if ((m = p.match(/(\d+)\s*(?:d|day|days)\b/i))) {
      out.time = `${m[1]}d`;
      out.prep = out.time;
    } else if ((m = p.match(/^\*\*(Easy|Medium|Hard)\*\*/i))) {
      const label = m[1];
      const map: Record<string, 1 | 2 | 3> = { easy: 1, medium: 2, hard: 3 };
      out.difficulty = map[label.toLowerCase()];
      out.difficultyLabel = label;
      const noteMatch = p.match(/\*\*[A-Za-z]+\*\*\s*\(([^)]+)\)/);
      out.difficultyNote = noteMatch ? noteMatch[1].trim() : null;
    } else if (/^\d+(?:\.\d+)?$/.test(p)) {
      // Bare number — servings (only if not already set, and no g/cal/min suffix)
      out.servings = parseInt(p, 10);
      out.serves = out.servings;
    } else if (/🥘|⚡|Bulk-Prep|Fast-Service/i.test(p)) {
      const tags: ("bulk-prep" | "fast-service")[] = [];
      if (/🥘|Bulk-Prep/i.test(p)) tags.push("bulk-prep");
      if (/⚡|Fast-Service/i.test(p)) tags.push("fast-service");
      out.tags = tags;
    }
  }
  return out;
}

function parseCostLine(line: string): { cost: number | null; menuPrice: string | null } {
  // Handles all observed variants:
  //   **Wholesale food cost:** $X.XX / serving · **Menu price:** $X–Y (...)
  //   **Wholesale food cost:** **$X.XX / serving** (note) · **Menu price:** **$X–Y** (note)
  const costMatch = line.match(/Wholesale food cost:\*\*[^$·]*\$([\d.]+)/i);
  const cost = costMatch ? parseFloat(costMatch[1]) : null;
  const priceMatch = line.match(/Menu price:\*\*\s*\*{0,2}\s*([^·*]+?)\s*\*{0,2}\s*(?=·|$)/i);
  const menuPrice = priceMatch ? priceMatch[1].trim() : null;
  return { cost, menuPrice };
}

function parseStatsLine(line: string): {
  weight: string | null;
  calories: number | null;
  protein: string | null;
  time: string | null;
  servings: number | null;
} {
  const get = (rx: RegExp) => { const m = line.match(rx); return m ? m[1].trim() : null; };
  const weight = get(/Weight:\*\*\s*([^·]+?)(?:\s*·|$)/i);
  const calStr = get(/Calories:\*\*\s*([\d,]+)/i);
  const calories = calStr ? parseInt(calStr.replace(/,/g, ""), 10) : null;
  const protein = get(/Protein:\*\*\s*([^·]+?)(?:\s*·|$)/i);
  const timeRaw = get(/Time:\*\*\s*([^·]+?)(?:\s*·|$)/i);
  const time = timeRaw ? normalizeTime(timeRaw) : null;
  const servStr = get(/Servings?:\*\*\s*([\d.]+)/i);
  const servings = servStr ? parseInt(servStr, 10) : null;
  return { weight, calories, protein, time, servings };
}

function normalizeTime(raw: string): string {
  // Examples in catalog: "30 min", "90 min (incl. par-sear)", "4 hr", "60 min active + 4 hr chill"
  // Strategy: take the first numeric+unit token; convert hr→h, min→m.
  const m = raw.match(/(\d+)\s*(min|minutes|m|hr|hours|h|d|day|days)\b/i);
  if (!m) return raw.trim();
  const n = parseInt(m[1], 10);
  const unit = m[2].toLowerCase();
  if (unit.startsWith("d")) return `${n}d`;
  if (unit.startsWith("h")) return `${n}h`;
  return `${n}m`;
}

function parseDifficulty(line: string): { difficulty: 1 | 2 | 3 | null; label: string | null; note: string | null } {
  // **Restaurant difficulty:** **Easy/Medium/Hard** — note
  const m = line.match(/Restaurant difficulty:\*\*\s*\*\*([A-Za-z]+)\*\*\s*(?:—|-)?\s*(.*)$/i);
  if (!m) return { difficulty: null, label: null, note: null };
  const label = m[1];
  const note = m[2].trim() || null;
  const map: Record<string, 1 | 2 | 3> = { easy: 1, medium: 2, hard: 3 };
  const difficulty = map[label.toLowerCase()] ?? null;
  return { difficulty, label, note };
}

function parseTags(line: string): ("bulk-prep" | "fast-service")[] {
  // **Tags:** 🥘 Bulk-Prep · ⚡ Fast-Service
  const tags: ("bulk-prep" | "fast-service")[] = [];
  if (/🥘|Bulk-Prep/i.test(line)) tags.push("bulk-prep");
  if (/⚡|Fast-Service/i.test(line)) tags.push("fast-service");
  return tags;
}

function parseSubsTable(lines: string[], startIdx: number): { subs: Sub[]; nextIdx: number } {
  // Expect: | Sub | Effect | Cost delta |  on lines[startIdx]
  //         | --- ... |
  //         data rows...
  //         (blank line or next ### or # heading)
  const subs: Sub[] = [];
  let i = startIdx;
  if (!lines[i] || !lines[i].trim().startsWith("|")) return { subs, nextIdx: i };
  // Header
  i++;
  // Separator
  if (lines[i] && /^\s*\|[-:|\s]+\|/.test(lines[i])) i++;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim().startsWith("|")) break;
    const cells = line.split("|").map(c => c.trim()).filter((_, idx, a) => idx > 0 && idx < a.length - 1);
    if (cells.length >= 3) {
      subs.push({ from: cells[0], effect: cells[1], delta: cells[2] });
    }
    i++;
  }
  return { subs, nextIdx: i };
}

function classifyPhoto(title: string, description: string): { photo: Photo; label: string } {
  const t = (title + " " + description).toLowerCase();
  let photo: Photo = "plate";
  if (/\b(soup|stew|curry|ramen|pho|chili|hotpot|hot pot|bowl|risotto|stroganoff|gumbo|cassoulet|wat|dal|jjigae|ppokkeumtang)\b/.test(t)) photo = "bowl";
  else if (/\b(sandwich|burger|wrap|taco|pizza|flatbread|quesadilla|hand-pie|pie|tart|tarte|crepe|frites|cake|cheesecake|brûlée|brulee|nuggets|wings|biscuits|salad)\b/.test(t)) photo = "flat";
  else if (/\b(layered|terrine|wellington|lasagna|moussaka|injera|stack)\b/.test(t)) photo = "layered";
  // Build a 3-token label from title keywords
  const keywords = title
    .replace(/\([^)]*\)/g, "")
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter(w => w.length > 2 && !["the", "and", "with", "vegan", "real", "for"].includes(w))
    .slice(0, 3);
  const label = keywords.length ? keywords.join(" · ") : title.toLowerCase();
  return { photo, label };
}

function classifyTier(title: string): Tier {
  for (const b of BRANDED_TITLES) if (title.includes(b)) return "branded";
  for (const h of HYBRID_TITLES) if (title.includes(h)) return "hybrid";
  return "in-house";
}

function deriveBadge(r: Pick<Recipe, "courses" | "tags" | "sourcingTier" | "difficulty" | "cost">): string | null {
  if (r.courses.includes("showstopper")) return "Showpiece";
  if (r.courses.includes("dessert")) return "Dessert";
  if (r.tags.includes("bulk-prep") && r.tags.includes("fast-service")) return "Service-friendly";
  if (r.tags.includes("fast-service")) return "Quick-fire";
  if (r.tags.includes("bulk-prep")) return "Batch-cook";
  if (r.cost !== null && r.cost <= 2.0) return "Margin King";
  if (r.difficulty === 3) return "Plate-forward";
  return null;
}

// Parse a menuPrice string ("$11–14 (entrée) / $7–9 (side)") to its midpoint.
// Picks the FIRST $X–Y range; tolerant of missing data.
function menuPriceMid(s: string | null): number | null {
  if (!s) return null;
  const range = s.match(/\$\s*([\d.]+)\s*[–\-—]\s*\$?\s*([\d.]+)/);
  if (range) return (parseFloat(range[1]) + parseFloat(range[2])) / 2;
  const single = s.match(/\$\s*([\d.]+)/);
  return single ? parseFloat(single[1]) : null;
}

// Value tier from food-cost ROI (menu midpoint ÷ food cost).
// Showstoppers always read as "Showpiece" — premium plates where ticket size
// matters more than the multiplier, even if the ratio looks thin.
function deriveValueTier(r: Pick<Recipe, "courses" | "cost" | "menuPrice">): { ratio: number | null; tier: string | null } {
  if (r.courses.includes("showstopper")) {
    const mid = menuPriceMid(r.menuPrice);
    const ratio = mid && r.cost ? mid / r.cost : null;
    return { ratio, tier: "Showpiece" };
  }
  const mid = menuPriceMid(r.menuPrice);
  if (!mid || !r.cost) return { ratio: null, tier: null };
  const ratio = mid / r.cost;
  let tier: string;
  if (ratio >= 8) tier = "Margin King";
  else if (ratio >= 4) tier = "Strong Earner";
  else if (ratio >= 2) tier = "Solid";
  else tier = "Showpiece";
  return { ratio, tier };
}

// ---------- Main parse ----------
function main() {
  const md = readFileSync(SRC, "utf8");
  const lines = md.split(/\r?\n/);

  // Load URL overrides (if present). Keyed by recipe id; values are replacement URLs.
  let overrides: Record<string, string> = {};
  try {
    const raw = readFileSync(OVERRIDES_PATH, "utf8");
    overrides = JSON.parse(raw);
    delete (overrides as any)._comment;
  } catch { /* no overrides file — fine */ }

  // Load description overrides — hand-curated for recipes whose catalog markdown lacks a description bullet.
  let descOverrides: Record<string, string> = {};
  try {
    const raw = readFileSync(DESC_OVERRIDES_PATH, "utf8");
    descOverrides = JSON.parse(raw);
    delete (descOverrides as any)._comment;
  } catch { /* no overrides file — fine */ }

  // Alternative-recipe links per recipe id.
  let altOverrides: Record<string, Alternative[]> = {};
  try {
    const raw = readFileSync(ALT_OVERRIDES_PATH, "utf8");
    altOverrides = JSON.parse(raw);
    delete (altOverrides as any)._comment;
  } catch { /* no overrides file — fine */ }

  // Generic per-recipe field patches (cost, time, servings, etc.).
  // Used when the catalog's compact format doesn't parse cleanly.
  let recipeOverrides: Record<string, Partial<Recipe>> = {};
  try {
    const raw = readFileSync(RECIPE_OVERRIDES_PATH, "utf8");
    recipeOverrides = JSON.parse(raw);
    delete (recipeOverrides as any)._comment;
  } catch { /* no overrides file — fine */ }

  const recipes: Recipe[] = [];
  const tipSections: { id: string; title: string; bodyLines: string[] }[] = [];
  let currentCuisine: { slug: string; name: string } | null = null;
  let inFinalNotes = false;
  let currentTip: { id: string; title: string; bodyLines: string[] } | null = null;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Any H2 ends a cuisine section (prevents Final Notes from bleeding into the last cuisine).
    if (/^##\s+/.test(line)) {
      currentCuisine = null;
      inFinalNotes = /Final Notes/i.test(line);
      currentTip = null;
      i++;
      continue;
    }

    // H1 cuisine section: "# 1. American" or "# 17. Brazilian (NEW SECTION)"
    const h1 = line.match(/^#\s+\d+\.\s+(.+?)\s*$/);
    if (h1) {
      const key = h1[1].trim();
      const stripped = key.replace(/\s*\(NEW SECTION\)\s*$/, "");
      currentCuisine = CUISINE_MAP[key] || CUISINE_MAP[stripped] || null;
      inFinalNotes = false;
      currentTip = null;
      i++;
      continue;
    }

    // Inside Final Notes — collect H3 sections as Tips & Tricks entries.
    if (inFinalNotes && line.startsWith("### ")) {
      const title = line.replace(/^#+\s*/, "").trim();
      currentTip = { id: slugify(title), title, bodyLines: [] };
      tipSections.push(currentTip);
      i++;
      continue;
    }
    if (inFinalNotes && currentTip && !line.startsWith("# ") && !line.startsWith("## ")) {
      currentTip.bodyLines.push(line);
      i++;
      continue;
    }

    // H3 recipe header
    if (line.startsWith("### ") && currentCuisine) {
      const rawTitle = line;
      const { title, source } = cleanTitle(rawTitle);
      const courses = parseCourses(rawTitle);

      // Stable id: strip course markers and any trailing parenthetical (descriptor or paren-author),
      // but KEEP em-dash content (so prior IDs like "korean-vegan-bibimbap-okonomi-kitchen" stay valid).
      const stableSlugSource = rawTitle
        .replace(/^#+\s*/, "")
        .replace(/\s*\(\*\*[^)]*\*\*[^)]*\)/g, "")
        .replace(/\s*\([^)]+\)\s*$/, "")
        .trim();
      const id = `${currentCuisine.slug}-${slugify(stableSlugSource)}`;
      const displayTitle = transformVeganTitle(title, currentCuisine.slug);

      const recipe: Recipe = {
        id,
        title: displayTitle,
        source,
        rawTitle,
        rawBody: "",
        valueRatio: null,
        valueTier: null,
        cuisine: currentCuisine.slug,
        cuisineName: currentCuisine.name,
        courses,
        url: null,
        urlStatus: "unknown",
        urlNote: null,
        description: "",
        cost: null,
        menuPrice: null,
        weight: null,
        calories: null,
        protein: null,
        time: null,
        prep: null,
        servings: null,
        serves: null,
        difficulty: null,
        difficultyLabel: null,
        difficultyNote: null,
        tags: [],
        sourcingTier: classifyTier(title),
        subs: [],
        alternatives: [],
        photo: "plate",
        photoLabel: "",
        badge: null,
      };

      // Parse the field bullets that follow.
      // Stop at the next H3, next H1, or `---`.
      const bodyStart = i + 1;
      i++;
      while (i < lines.length) {
        const l = lines[i];
        if (l.startsWith("### ") || l.startsWith("# ") || /^---\s*$/.test(l)) break;
        // URL-line variants: **URL:**, **Source URL:**, **Source / inspiration URL:**
        if (/^\s*-\s*\*\*(URL|Source URL|Source\s*\/\s*inspiration URL):\*\*/i.test(l)) {
          const u = parseUrlLine(l);
          recipe.url = u.url; recipe.urlStatus = u.status; recipe.urlNote = u.note;
        } else if (/^\s*-\s*\*\*Description:\*\*/i.test(l)) {
          recipe.description = l.replace(/^\s*-\s*\*\*Description:\*\*\s*/i, "").trim();
        } else if (/^\s*-\s*\*\*Wholesale food cost:\*\*/i.test(l)) {
          const c = parseCostLine(l);
          recipe.cost = c.cost; recipe.menuPrice = c.menuPrice;
        } else if (/Weight:\*\*/i.test(l) && /Calories:\*\*/i.test(l)) {
          const s = parseStatsLine(l);
          recipe.weight = s.weight; recipe.calories = s.calories; recipe.protein = s.protein;
          recipe.time = s.time; recipe.prep = s.time;
          recipe.servings = s.servings; recipe.serves = s.servings;
        } else if (/Restaurant difficulty:\*\*/i.test(l)) {
          const d = parseDifficulty(l);
          recipe.difficulty = d.difficulty;
          recipe.difficultyLabel = d.label;
          recipe.difficultyNote = d.note;
        } else if (/^\s*-\s*\*\*Tags:\*\*/i.test(l)) {
          recipe.tags = parseTags(l);
        } else if (/^\s*-\s*\$[\d.]+\s*\/\s*serving/i.test(l) ||
                   /^\s*-\s*\d+\s*g\s*·\s*\d+\s*cal/i.test(l)) {
          // Compact format: full stats on one line, OR stats-only continuation line.
          // Object.assign skips undefined keys, so the second call only fills gaps.
          const c = parseCompactStatsLine(l);
          if (c) {
            for (const [k, v] of Object.entries(c)) {
              if (v !== undefined && v !== null) (recipe as any)[k] = v;
            }
          }
        } else if (l.trim().startsWith("|")) {
          // Subs table (or any markdown table).
          const { subs, nextIdx } = parseSubsTable(lines, i);
          if (subs.length) recipe.subs = subs;
          i = nextIdx;
          continue;
        }
        i++;
      }

      // Capture the full raw markdown body (everything between this H3 and the next section break).
      recipe.rawBody = lines.slice(bodyStart, i).join("\n").replace(/\n+$/, "");

      // Apply URL override if one exists for this recipe.
      if (overrides[recipe.id]) {
        recipe.url = overrides[recipe.id];
        recipe.urlStatus = "verified";
        recipe.urlNote = (recipe.urlNote ? recipe.urlNote + " · " : "") + "URL replaced via url_overrides.json";
      }

      // Attach hand-curated alternative recipes for this id (if any).
      if (altOverrides[recipe.id]) {
        recipe.alternatives = altOverrides[recipe.id];
      }

      // Apply generic field patches LAST so they win over parsed values.
      if (recipeOverrides[recipe.id]) {
        Object.assign(recipe, recipeOverrides[recipe.id]);
      }

      // Fallback source: derive from URL hostname (e.g. noracooks.com → Nora Cooks).
      if (!recipe.source && recipe.url) {
        recipe.source = sourceFromUrl(recipe.url);
      }
      // Source-name qualifier overrides — credit specific authors with their hat.
      if (recipe.source && /^Gauthier($|\s)/i.test(recipe.source)) {
        recipe.source = "Chef Gauthier Soho (Michelin Star)";
      }

      // Description: prefer hand-curated override → catalog `**Description:**` line → fallback.
      if (descOverrides[recipe.id]) {
        recipe.description = descOverrides[recipe.id];
      } else if (!recipe.description) {
        const tagBits: string[] = [];
        if (recipe.tags.includes("bulk-prep")) tagBits.push("bulk-prep");
        if (recipe.tags.includes("fast-service")) tagBits.push("fast-service");
        const tagFrag = tagBits.length ? ` · ${tagBits.join(", ")}` : "";
        const courseFrag = recipe.courses[0] && recipe.courses[0] !== "main"
          ? ` ${recipe.courses[0]}`
          : "";
        if (recipe.difficultyNote) {
          recipe.description = `${recipe.difficultyLabel || "Recipe"}${courseFrag} — ${recipe.difficultyNote}${tagFrag}.`;
        } else {
          recipe.description = `${recipe.cuisineName}${courseFrag} · view the linked recipe for the full method${tagFrag}.`;
        }
      }

      // Photo classification + badge derivation
      const ph = classifyPhoto(recipe.title, recipe.description);
      recipe.photo = ph.photo;
      recipe.photoLabel = ph.label;
      const v = deriveValueTier(recipe);
      recipe.valueRatio = v.ratio;
      recipe.valueTier = v.tier;
      // Card badge: prefer the value tier (high-margin labelling), fall back to course/tag archetype.
      recipe.badge = v.tier || deriveBadge(recipe);

      // Stash the source if we cleaned one out of the title (like "(Nora Cooks)")
      if (source) {
        // Prepend to description as a citation if not already present.
        if (recipe.description && !recipe.description.includes(source)) {
          // Don't mutate description; the source is implicitly in the URL note.
        }
      }

      recipes.push(recipe);
      continue;
    }

    i++;
  }

  // ---------- Write per-cuisine files ----------
  mkdirSync(OUT_DIR, { recursive: true });
  const byCuisine = new Map<string, Recipe[]>();
  for (const r of recipes) {
    if (!byCuisine.has(r.cuisine)) byCuisine.set(r.cuisine, []);
    byCuisine.get(r.cuisine)!.push(r);
  }

  const indexEntries: { slug: string; name: string; count: number; file: string }[] = [];
  for (const [slug, list] of byCuisine) {
    const name = list[0].cuisineName;
    const file = `${slug}.json`;
    writeFileSync(join(OUT_DIR, file), JSON.stringify(list, null, 2));
    // Per-cuisine browser script: registers on window.APB_RECIPES
    writeFileSync(
      join(OUT_DIR, `${slug}.js`),
      `// Auto-generated from vegan-restaurant-catalog-v5.md — do not edit by hand.\n` +
      `(window.APB_RECIPES = window.APB_RECIPES || []).push(...${JSON.stringify(list, null, 2)});\n`
    );
    indexEntries.push({ slug, name, count: list.length, file });
  }

  // Order the index by the source-of-truth catalog order
  const order = Object.values(CUISINE_MAP).map(c => c.slug);
  indexEntries.sort((a, b) => order.indexOf(a.slug) - order.indexOf(b.slug));

  const totalCost = recipes.filter(r => r.cost).reduce((s, r) => s + (r.cost ?? 0), 0);
  const avgCost = totalCost / recipes.filter(r => r.cost).length;

  const indexPayload = {
    generatedAt: new Date().toISOString(),
    source: "vegan-restaurant-catalog-v5.md",
    totalRecipes: recipes.length,
    avgCostPerPlate: Number(avgCost.toFixed(2)),
    cuisines: indexEntries,
  };
  writeFileSync(join(OUT_DIR, "_index.json"), JSON.stringify(indexPayload, null, 2));
  writeFileSync(
    join(OUT_DIR, "_index.js"),
    `// Auto-generated from vegan-restaurant-catalog-v5.md — do not edit by hand.\n` +
    `window.APB_INDEX = ${JSON.stringify(indexPayload, null, 2)};\n`
  );

  // ---------- Lookup map: normalized dish name → recipe id ----------
  // Used by the Tips & Tricks page to linkify dish mentions back to /recipes#r=<id>.
  const lookup: Record<string, string> = {};
  // Common leading qualifiers that operators / catalog entries add but tip
  // sections drop (e.g. "Classic Hummus" → tip says just "Hummus").
  const QUALIFIERS = [
    "classic", "authentic", "best", "easy", "simple", "ultimate", "quick",
    "the", "vegan", "house", "homemade", "real", "traditional",
  ];
  function norm(s: string): string {
    return s
      .normalize("NFD").replace(/[̀-ͯ]/g, "")  // strip diacritics
      .toLowerCase()
      .replace(/œ/g, "oe").replace(/æ/g, "ae")
      .replace(/\(([^)]+)\)/g, "")
      .replace(/[''"`]/g, "")
      .replace(/[^a-z0-9\s\-\/&]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
  function stripQualifier(s: string): string {
    for (const q of QUALIFIERS) {
      const pre = q + " ";
      if (s.startsWith(pre)) return stripQualifier(s.slice(pre.length));
    }
    return s;
  }
  for (const r of recipes) {
    const variants = new Set<string>();
    const baseRaw = r.rawTitle
      .replace(/^#+\s*/, "")
      .replace(/\s*\(\*\*[^)]*\*\*[^)]*\)/g, "")
      .replace(/\s+—\s+.+$/, "");
    const candidates = [
      r.title,
      r.title.split("/")[0],
      baseRaw,
      baseRaw.replace(/^Vegan\s+/i, ""),
    ];
    for (const c of candidates) {
      const n = norm(c);
      if (n) {
        variants.add(n);
        variants.add(stripQualifier(n));
        // Also emit 2- and 3-word tails (last-N words). Lets short tip mentions
        // like "pad thai" / "bourguignon" resolve to "Easy Tofu Pad Thai" /
        // "Bouf Bourguignon Maitake".
        const words = stripQualifier(n).split(/\s+/).filter(Boolean);
        for (let take = 1; take <= 3 && take <= words.length; take++) {
          const tail = words.slice(words.length - take).join(" ");
          if (tail.length >= 5) variants.add(tail);
        }
      }
    }
    for (const v of variants) {
      if (v && v.length >= 3 && !lookup[v]) lookup[v] = r.id;
    }
  }
  writeFileSync(join(OUT_DIR, "_lookup.json"), JSON.stringify(lookup, null, 2));
  writeFileSync(
    join(OUT_DIR, "_lookup.js"),
    `// Auto-generated dish-name → recipe-id lookup. Used by tips & tricks to linkify dish mentions.\n` +
    `window.APB_LOOKUP = ${JSON.stringify(lookup, null, 2)};\n`
  );

  // ---------- Tips & Tricks (Final Notes H3 sections) ----------
  type TipOverride = string | { title?: string; body?: string };
  let tipOverrides: Record<string, TipOverride> = {};
  try {
    const raw = readFileSync(TIP_OVERRIDES_PATH, "utf8");
    tipOverrides = JSON.parse(raw);
    delete (tipOverrides as any)._comment;
  } catch { /* no tip overrides — fine */ }

  const tips = tipSections.map(t => {
    const o = tipOverrides[t.id];
    const overrideBody = typeof o === "string" ? o : o?.body;
    const overrideTitle = typeof o === "object" && o !== null ? o.title : undefined;
    return {
      id: t.id,
      title: overrideTitle || t.title,
      body: overrideBody || t.bodyLines.join("\n").trim(),
    };
  }).filter(t => t.body.length > 0);

  // Hand-authored tip sections, kept separate from the catalog so the
  // markdown stays the imported source of truth. Each entry can set
  // `position: "prepend" | "append"` (default "prepend"); order within each
  // bucket follows the file order.
  try {
    const raw = readFileSync(TIP_ADDITIONS_PATH, "utf8");
    const additions: { id: string; title: string; body: string; position?: "prepend" | "append" }[] = JSON.parse(raw);
    const fresh = additions.filter(a =>
      a && a.id && a.title && a.body && !tips.find(t => t.id === a.id)
    );
    const head = fresh.filter(a => a.position !== "append").map(a => ({ id: a.id, title: a.title, body: a.body }));
    const tail = fresh.filter(a => a.position === "append").map(a => ({ id: a.id, title: a.title, body: a.body }));
    tips.unshift(...head);
    tips.push(...tail);
  } catch { /* no additions file — fine */ }

  writeFileSync(join(OUT_DIR, "_tips.json"), JSON.stringify(tips, null, 2));
  writeFileSync(
    join(OUT_DIR, "_tips.js"),
    `// Auto-generated from vegan-restaurant-catalog-v5.md — do not edit by hand.\n` +
    `window.APB_TIPS = ${JSON.stringify(tips, null, 2)};\n`
  );
  console.log(`Tips & tricks: ${tips.length} sections → _tips.json + _tips.js`);

  // ---------- Summary ----------
  console.log(`Parsed ${recipes.length} recipes across ${byCuisine.size} cuisines.`);
  for (const e of indexEntries) {
    console.log(`  ${e.slug.padEnd(16)} ${String(e.count).padStart(3)} → ${e.file}`);
  }
  console.log(`Avg cost / plate: $${avgCost.toFixed(2)}`);
  console.log(`Output: ${OUT_DIR}`);
}

main();
