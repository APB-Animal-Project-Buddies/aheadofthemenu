import { readFileSync } from "node:fs";

/**
 * Central source of truth for turning VAGUE ingredient measures into rough numeric
 * amounts, for nutrition estimation. The values live in `nutrition-measures.txt`
 * (edit there — one place changes every dish); this module just parses and applies
 * them. Recipe data stays faithful ("a few sprigs", "generously"); the estimate is
 * derived at calc time, so originals are never overwritten.
 *
 * It only fills in a value when the ingredient has no usable numeric quantity of its
 * own — a real quantity always wins. Frying-oil absorption is deliberately NOT here:
 * it's per-dish (a donut absorbs far more than a blini) and can't be derived from a
 * generic phrase, so it's handled separately (per-dish hidden ingredients).
 */

export type MeasureEstimate = { quantity: number | string; unit: string; basis: string };
type Rule = { phrase: string; re: RegExp; qualifier: "herb" | "salt" | "pepper" | null; est: MeasureEstimate };

const HERB_RE = /mint|dill|basil|parsley|coriander|cilantro|chive|thyme|rosemary|sage|tarragon|oregano/i;

/** Parse the .txt rule table into ordered rules. Exported for testing. */
export function parseRules(text: string): Rule[] {
  const rules: Rule[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const [lhs, rhs] = line.split("::").map((s) => s.trim());
    if (!lhs || !rhs) continue;
    const [phraseRaw, qual] = lhs.split("@").map((s) => s.trim());
    const m = rhs.match(/^(\S+)\s+(\S+)$/);
    if (!m) continue;
    const quantity: number | string = /^\d+(\.\d+)?$/.test(m[1]) ? Number(m[1]) : m[1];
    const phrase = phraseRaw.toLowerCase();
    rules.push({
      phrase,
      re: new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i"),
      qualifier: (qual as Rule["qualifier"]) ?? null,
      est: { quantity, unit: m[2], basis: `${phrase} ≈ ${m[1]} ${m[2]}` },
    });
  }
  return rules;
}

const RULES: Rule[] = parseRules(readFileSync(new URL("./nutrition-measures.txt", import.meta.url), "utf8"));

/** True when the ingredient already carries a usable numeric quantity. */
export function hasNumericQuantity(quantity: unknown): boolean {
  if (typeof quantity === "number") return Number.isFinite(quantity);
  if (typeof quantity === "string") return /^\s*\d/.test(quantity);
  return false;
}

/**
 * Estimate a numeric measure for a vague/quantity-less ingredient, or null when the
 * ingredient already has a real quantity (use that) or nothing sensible applies.
 * `includeToTaste` (default false) opts into rough salt/pepper "to taste" amounts.
 */
export function estimateVagueMeasure(
  ing: { name?: string; quantity?: unknown; unit?: string; note?: string },
  opts: { includeToTaste?: boolean } = {}
): MeasureEstimate | null {
  if (hasNumericQuantity(ing?.quantity)) return null;

  const name = (ing?.name ?? "").toLowerCase();
  const ctx = `${ing?.note ?? ""} ${ing?.unit ?? ""}`.toLowerCase();
  const isHerb = HERB_RE.test(name);

  for (const r of RULES) {
    if (r.qualifier === "herb") { if (isHerb && r.re.test(ctx)) return r.est; continue; }
    if (r.qualifier === "salt" || r.qualifier === "pepper") {
      if (opts.includeToTaste && r.re.test(`${ctx} ${name}`) && new RegExp(r.qualifier, "i").test(name)) return r.est;
      continue;
    }
    if (r.re.test(ctx)) return r.est;
  }
  return null;
}
