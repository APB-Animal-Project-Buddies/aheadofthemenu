/**
 * Small fuzzy-matching helper for creator-name entry: typo-tolerant ranking for
 * the autocomplete dropdown, and closest-match detection for the "did you mean?"
 * near-duplicate warning. Pure + unit-testable (no framework deps).
 */

/** Lowercase, strip accents/punctuation, collapse whitespace. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Levenshtein edit distance (iterative, two-row). */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let curr = new Array<number>(b.length + 1);
  for (let i = 0; i < a.length; i++) {
    curr[0] = i + 1;
    for (let j = 0; j < b.length; j++) {
      const cost = a[i] === b[j] ? 0 : 1;
      curr[j + 1] = Math.min(curr[j] + 1, prev[j + 1] + 1, prev[j] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

/**
 * Similarity 0..1 between two names: the best of normalized edit-distance,
 * token overlap (handles word reorder / partial names), and a substring bonus.
 */
export function similarity(a: string, b: string): number {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;

  const editSim = 1 - levenshtein(na, nb) / Math.max(na.length, nb.length);

  const ta = Array.from(new Set(na.split(" ")));
  const tb = new Set(nb.split(" "));
  let shared = 0;
  for (const t of ta) if (tb.has(t)) shared++;
  const tokenSim = shared / Math.max(ta.length, tb.size);

  const sub = nb.includes(na) || na.includes(nb) ? 0.9 : 0;

  return Math.max(editSim, tokenSim, sub);
}

/** Ranked fuzzy matches for `query` against `options`, best first. */
export function fuzzyMatches(query: string, options: readonly string[], limit = 8): string[] {
  const q = normalize(query);
  if (!q) return options.slice(0, limit);
  return options
    .map((o) => ({ o, s: similarity(query, o) + (normalize(o).startsWith(q) ? 0.15 : 0) }))
    .filter((x) => x.s >= 0.34)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.o);
}

/**
 * The single closest existing option when the query is a near-match but NOT an
 * exact one — used to prompt "Did you mean X?" before a new creator is created.
 * Returns null on an exact match (nothing to correct) or when nothing is close.
 */
export function closestMatch(query: string, options: readonly string[], threshold = 0.72): string | null {
  const q = normalize(query);
  if (!q) return null;
  let best: string | null = null;
  let bestS = 0;
  for (const o of options) {
    if (normalize(o) === q) return null; // exact match already exists
    const s = similarity(query, o);
    if (s > bestS) {
      bestS = s;
      best = o;
    }
  }
  return bestS >= threshold ? best : null;
}
