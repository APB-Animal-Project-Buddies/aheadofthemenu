// Vetting helpers for building a nutrition dataset: clean an ingredient name into a search
// query, decide whether a candidate food actually matches, and sanity-check the panel.
import { normalize } from "../ingredients";
import type { NutrientKey } from "./nutrients";

const UNITS = new Set([
  "cup", "cups", "tbsp", "tablespoon", "tablespoons", "tsp", "teaspoon", "teaspoons",
  "oz", "ounce", "ounces", "lb", "lbs", "pound", "pounds", "g", "gram", "grams", "kg",
  "ml", "l", "litre", "liter", "pinch", "dash", "clove", "cloves", "slice", "slices",
  "can", "cans", "jar", "jars", "package", "packages", "pack", "handful", "piece", "pieces",
  "sprig", "sprigs", "stick", "sticks", "bunch", "head", "large", "medium", "small",
]);
const PREP = new Set([
  "raw", "fresh", "cooked", "roasted", "dried", "ground", "whole", "canned", "frozen",
  "powdered", "powder", "puree", "pureed", "chopped", "sliced", "diced", "minced", "grated",
  "crushed", "shredded", "peeled", "cubed", "halved", "toasted", "smoked", "boiled", "steamed",
]);

export interface CleanedQuery {
  query: string;
  isIngredient: boolean; // false = looks like a measurement / non-ingredient row
  stripped: string[]; // tokens removed (prep/units/quantities)
}

// "bell peppers (chopped)" -> "bell peppers"; "1 cup" -> "" (non-ingredient).
export function cleanQuery(name: string): CleanedQuery {
  const stripped: string[] = [];
  let s = name.toLowerCase().replace(/\([^)]*\)/g, " ").replace(/[^a-z0-9\s/.-]/g, " ");
  const toks = s.split(/\s+/).filter(Boolean);
  const kept: string[] = [];
  for (const t of toks) {
    if (/^[0-9]+([./-][0-9]+)?$/.test(t)) { stripped.push(t); continue; } // 1, 1/2, 1.5, 2-3
    if (UNITS.has(t) || PREP.has(t)) { stripped.push(t); continue; }
    kept.push(t);
  }
  const query = kept.join(" ").trim();
  return { query, isIngredient: query.length > 0, stripped };
}

function lev(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (Math.abs(m - n) > 2) return 9;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}

// Generic "form" words — a match on these alone (e.g. "flakes", "milk") is not enough; and
// when one is the ingredient's HEAD, the matched food must actually contain it.
const FOOD_TYPE = new Set(["milk", "paste", "flour", "oil", "sauce", "butter", "powder", "flakes",
  "meal", "water", "extract", "cream", "cheese", "juice", "syrup", "seeds", "seed", "leaves", "granules", "puree"]);
// USDA head categories that are prepared/branded products, almost never the right generic match.
const COMPOSITE_HEADS = new Set(["candie", "cracker", "cookie", "roll", "cereal", "snack", "pickle",
  "beverage", "soup", "gravy", "babyfood", "dessert", "pie", "pastry", "bar"].map(normalize));
const ANIMAL = new Set(["chicken", "beef", "pork", "fish", "egg", "turkey", "lamb", "veal", "crab",
  "shrimp", "bacon", "sausage", "ham", "tuna", "salmon", "cod", "caribou"].map(normalize));

const fnorm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).map(normalize).filter(Boolean);
const isBrandToken = (raw: string) => /^[A-Z][A-Z'.&]{2,}$/.test(raw); // ALL-CAPS brand, e.g. NESTLE

export interface MatchVerdict {
  overlap: boolean; // any query token appears
  strong: boolean; // every query token appears
  weak: boolean; // fails a stricter guard -> should go to review
  reasons: string[];
}

// Stricter relevance check: catches branded/composite foods and generic-token-only matches.
export function classifyMatch(query: string, foodName: string): MatchVerdict {
  const qTok = query.split(/\s+/).map(normalize).filter((w) => w.length > 2);
  const rawQ = query.split(/\s+/).filter((w) => w.length > 2);
  const fTok = fnorm(foodName);
  if (!qTok.length) return { overlap: false, strong: false, weak: true, reasons: ["empty-query"] };

  const matchTok = (w: string) => fTok.some((d) => d.includes(w) || w.includes(d) || lev(w, d) <= 1);
  const hits = qTok.map(matchTok);
  const overlap = hits.some(Boolean);
  const strong = hits.every(Boolean);

  const reasons: string[] = [];
  // content token = the non-generic words; at least one must match
  const contentMatched = qTok.filter((w) => !FOOD_TYPE.has(w)).some(matchTok);
  if (!contentMatched) reasons.push("only-generic-token-matched");
  // if the head (last word) is a food-type word, the food must contain it
  const head = qTok[qTok.length - 1];
  if (FOOD_TYPE.has(head) && !matchTok(head)) reasons.push(`missing-head:${rawQ[rawQ.length - 1]}`);
  // branded / composite / animal foods are almost never the right generic match
  if (foodName.split(/\s+/).some(isBrandToken)) reasons.push("branded-food");
  const foodHead = normalize(foodName.split(",")[0]);
  if (COMPOSITE_HEADS.has(foodHead)) reasons.push(`composite-head:${foodName.split(",")[0]}`);
  if (fTok.some((t) => ANIMAL.has(t))) reasons.push("animal-food");
  if (!overlap) reasons.push("no-overlap");

  return { overlap, strong, weak: reasons.length > 0, reasons };
}

// Split a weak verdict's reasons into FATAL (the match is simply wrong — don't spend a human
// on it) and SOFT (suspicious, worth eyes). Fatal matches are recorded as `rejected` with the
// rule that fired; the ingredient stays in the pool for a better query, nothing is deleted.
export interface Triage {
  fatal: string[];
  soft: string[];
}
export function triageMatch(query: string, reasons: string[], strong = false): Triage {
  const qTok = query.split(/\s+/).map(normalize).filter(Boolean);
  const fatal: string[] = [], soft: string[] = [];
  for (const r of reasons) {
    switch (r.split(":")[0]) {
      // no shared token, nothing to search on, or only a filler word like "milk" carried it
      case "no-overlap":
      case "empty-query":
      case "only-generic-token-matched":
      // head noun absent: "cashew milk" -> "Nuts, cashew nuts, raw" is a different food
      case "missing-head":
        fatal.push(r); break;
      // our pool holds real animal foods too, so this is only wrong when OUR side is plant
      case "animal-food":
        (qTok.some((t) => ANIMAL.has(t)) ? soft : fatal).push(r); break;
      // "cookie dough" may legitimately land on a Cookies row; "fresh dill" -> Pickles may not
      case "composite-head": {
        const h = normalize(r.slice("composite-head:".length));
        (qTok.some((t) => t.includes(h) || h.includes(t)) ? soft : fatal).push(r); break;
      }
      // a brand row can still be the same food ("cereal flakes" -> POST Bran Flakes), but only
      // when every query token is present; otherwise it's brand-name coincidence
      // ("arabica coffee" -> SILK Coffee, soymilk)
      case "branded-food":
        (strong ? soft : fatal).push(r); break;
      // anything added later stays a judgement call
      default: soft.push(r);
    }
  }
  return { fatal, soft };
}

// Atwater sanity: 4·protein + 9·fat + 4·carb should be within ~35% of stated energy.
// Returns true when plausible or not checkable (missing pieces / very low energy).
export function atwaterPlausible(n: Partial<Record<NutrientKey, number>>): boolean {
  const energy = n.energy;
  if (energy == null || energy < 20) return true;
  const computed = 4 * (n.protein ?? 0) + 9 * (n.total_fat ?? 0) + 4 * (n.carbohydrate ?? 0);
  if (computed === 0) return true;
  return Math.abs(computed - energy) / energy <= 0.35;
}
