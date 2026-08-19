// Reconcile nutrition candidates from multiple sources into one record, preserving every
// source value per nutrient and FLAGGING disagreements, partial coverage, and duplicates.
//
// Note: a USDA hit is a generic food and an OFF hit is a branded product, so some spread is
// expected — a "conflict" flag means "worth a human look / record the discrepancy", not
// "one is wrong". We keep both values either way.
import { NUTRIENT_META, CORE_NUTRIENT_KEYS, type NutrientUnit } from "./gamut";
import type { NutrientKey } from "./nutrients";
import type { NutritionHit, NutritionSource } from "./types";

export type Agreement = "single" | "agree" | "conflict";

export interface SourceValue {
  source: NutritionSource;
  sourceId: string;
  value: number;
  citation: string;
  url?: string;
}

export interface ReconciledNutrient {
  key: NutrientKey;
  unit: NutrientUnit;
  values: SourceValue[]; // every source that reported this nutrient
  chosen: number; // selected value, by source priority
  chosenSource: NutritionSource;
  agreement: Agreement;
  relativeDiff?: number; // max pairwise |a-b| / max(|a|,|b|), when >1 source
}

export interface ContributingSource {
  source: NutritionSource;
  sourceId: string;
  name: string;
  detail?: string;
  citation: string;
  url?: string;
  reportedKeys: number;
}

export interface NutritionRecord {
  query: string;
  sources: ContributingSource[];
  duplicates: ContributingSource[]; // extra hits from an already-seen (source,id) or same source
  nutrients: Partial<Record<NutrientKey, ReconciledNutrient>>;
  conflicts: NutrientKey[]; // keys where sources disagree beyond tolerance
  coverage: {
    corePresent: NutrientKey[];
    coreMissing: NutrientKey[];
    isPartial: boolean; // any core nutrient missing
    totalKeys: number;
  };
}

export interface ReconcileOptions {
  // relative difference above which two source values are a "conflict" (default 15%).
  conflictTolerance?: number;
  // which source wins for `chosen` (default USDA first — generic reference beats branded).
  sourcePriority?: NutritionSource[];
}

function relDiff(a: number, b: number): number {
  const m = Math.max(Math.abs(a), Math.abs(b));
  return m === 0 ? 0 : Math.abs(a - b) / m;
}

export function reconcileHits(query: string, hits: NutritionHit[], opts: ReconcileOptions = {}): NutritionRecord {
  const { conflictTolerance = 0.15, sourcePriority = ["usda", "off"] } = opts;

  // De-duplicate by (source, sourceId); collect the rest as duplicates for the record.
  const seen = new Set<string>();
  const unique: NutritionHit[] = [];
  const duplicates: ContributingSource[] = [];
  for (const h of hits) {
    const id = `${h.source}:${h.sourceId}`;
    const meta = { source: h.source, sourceId: h.sourceId, name: h.name, detail: h.detail, citation: h.citation, url: h.url, reportedKeys: Object.keys(h.nutrients).length };
    if (seen.has(id)) duplicates.push(meta);
    else { seen.add(id); unique.push(h); }
  }

  const sources: ContributingSource[] = unique.map((h) => ({
    source: h.source, sourceId: h.sourceId, name: h.name, detail: h.detail, citation: h.citation, url: h.url, reportedKeys: Object.keys(h.nutrients).length,
  }));

  // Gather per-nutrient source values.
  const byKey = new Map<NutrientKey, SourceValue[]>();
  for (const h of unique) {
    for (const [k, v] of Object.entries(h.nutrients)) {
      if (typeof v !== "number") continue;
      const key = k as NutrientKey;
      (byKey.get(key) ?? byKey.set(key, []).get(key)!).push({
        source: h.source, sourceId: h.sourceId, value: v, citation: h.citation, url: h.url,
      });
    }
  }

  const pick = (values: SourceValue[]) =>
    [...values].sort((a, b) => sourcePriority.indexOf(a.source) - sourcePriority.indexOf(b.source))[0];

  const nutrients: Partial<Record<NutrientKey, ReconciledNutrient>> = {};
  const conflicts: NutrientKey[] = [];
  for (const [key, values] of Array.from(byKey.entries())) {
    const chosen = pick(values);
    let agreement: Agreement = "single";
    let relativeDiff: number | undefined;
    if (values.length > 1) {
      relativeDiff = Math.max(
        ...values.flatMap((a: SourceValue, i: number) => values.slice(i + 1).map((b: SourceValue) => relDiff(a.value, b.value)))
      );
      agreement = relativeDiff > conflictTolerance ? "conflict" : "agree";
      if (agreement === "conflict") conflicts.push(key);
    }
    nutrients[key] = {
      key, unit: NUTRIENT_META[key]?.unit ?? "g",
      values, chosen: chosen.value, chosenSource: chosen.source, agreement, relativeDiff,
    };
  }

  const corePresent = CORE_NUTRIENT_KEYS.filter((k) => nutrients[k]);
  const coreMissing = CORE_NUTRIENT_KEYS.filter((k) => !nutrients[k]);

  return {
    query, sources, duplicates, nutrients, conflicts,
    coverage: { corePresent, coreMissing, isPartial: coreMissing.length > 0, totalKeys: byKey.size },
  };
}
