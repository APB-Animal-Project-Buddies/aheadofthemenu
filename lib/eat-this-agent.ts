/**
 * lib/eat-this-agent.ts
 *
 * Pure logic for the agent-facing Eat This! endpoints: search result shaping,
 * query matching, and near-duplicate restaurant detection. No network, no
 * framework imports — everything here is bun-testable, matching the existing
 * split in lib/eat-this.ts.
 */
import { meterState, type VoteRow } from "@/lib/eat-this";
import { normalize, similarity } from "@/lib/fuzzy";

export const SITE_URL = "https://www.aheadofthemenu.com";

/** Threshold above which two restaurant names are treated as the same venue.
 * Matches lib/fuzzy's closestMatch default, which is already tuned for the
 * creator-name autocomplete. */
export const DUPLICATE_THRESHOLD = 0.72;

export type AgentScore =
  | { state: "scored"; pct: number; votes: number; tier: string }
  | { state: "tallying"; votes: number }
  | { state: "empty" };

/**
 * Score for the API, derived from meterState so the API tells exactly the same
 * truth as the UI. Below MIN_VOTES_TO_SCORE that means NO percentage: the site
 * deliberately withholds early numbers so they don't anchor voters, and an API
 * that leaked one would let an agent assert "91% loved it" about a dish with
 * two votes.
 */
export function agentScore(rows: VoteRow[]): AgentScore {
  const up = rows.filter((r) => r.value > 0).length;
  const down = rows.filter((r) => r.value < 0).length;
  const meh = rows.filter((r) => r.value === 0).length;
  const state = meterState({ up, meh, down });
  if (state.state === "scored") {
    return { state: "scored", pct: state.pct, votes: state.votes, tier: state.tier.label };
  }
  if (state.state === "tallying") return { state: "tallying", votes: state.votes };
  return { state: "empty" };
}

/**
 * Citable URL for a dish — the server-rendered detail page at
 * `app/eat-this/[id]/page.tsx`. Keep this pointing only at routes that actually
 * exist: these URLs are published in agent output, /llms.txt and the OpenAPI
 * document, so a wrong path here becomes 404s in someone's chat transcript.
 */
export const dishUrl = (dishId: string) => `${SITE_URL}/eat-this/${dishId}`;

export type SearchableDish = {
  id: string;
  name: string;
  description: string | null;
  tags: unknown;
  availability: string;
  restaurantId: string;
  restaurantName: string;
  neighborhood: string | null;
  votes: VoteRow[];
};

export type SearchResult = {
  dishId: string;
  dish: string;
  description: string | null;
  restaurantId: string;
  restaurant: string;
  neighborhood: string | null;
  tags: string[];
  availability: string;
  score: AgentScore;
  url: string;
};

export function toTagList(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  return tags.filter((t): t is string => typeof t === "string");
}

export function toSearchResult(d: SearchableDish): SearchResult {
  return {
    dishId: d.id,
    dish: d.name,
    description: d.description,
    restaurantId: d.restaurantId,
    restaurant: d.restaurantName,
    neighborhood: d.neighborhood,
    tags: toTagList(d.tags),
    availability: d.availability,
    score: agentScore(d.votes),
    url: dishUrl(d.id),
  };
}

export type SearchFilters = {
  q?: string | null;
  neighborhood?: string | null;
  tags?: string[] | null;
};

/** Free-text match across dish name, description, restaurant name, and tags. */
export function matchesQuery(d: SearchableDish, q: string): boolean {
  const needle = normalize(q);
  if (!needle) return true;
  const haystacks = [d.name, d.description ?? "", d.restaurantName, ...toTagList(d.tags)];
  return haystacks.some((h) => normalize(h).includes(needle));
}

export function applyFilters(dishes: SearchableDish[], f: SearchFilters): SearchableDish[] {
  let out = dishes;
  if (f.q?.trim()) out = out.filter((d) => matchesQuery(d, f.q as string));
  if (f.neighborhood?.trim()) {
    const n = normalize(f.neighborhood);
    out = out.filter((d) => normalize(d.neighborhood ?? "").includes(n));
  }
  if (f.tags?.length) {
    const wanted = f.tags.map(normalize).filter(Boolean);
    out = out.filter((d) => {
      const have = toTagList(d.tags).map(normalize);
      return wanted.every((w) => have.some((h) => h.includes(w)));
    });
  }
  return out;
}

/**
 * Ranks scored dishes first (highest percentage wins), then dishes still
 * tallying, then unvoted ones. Ties break alphabetically so paging is stable —
 * without a deterministic tiebreak an agent paging through results can see the
 * same dish twice and miss another.
 */
export function rankResults(results: SearchResult[]): SearchResult[] {
  const rank = (s: AgentScore) => (s.state === "scored" ? 0 : s.state === "tallying" ? 1 : 2);
  return [...results].sort((a, b) => {
    const ra = rank(a.score);
    const rb = rank(b.score);
    if (ra !== rb) return ra - rb;
    if (a.score.state === "scored" && b.score.state === "scored" && a.score.pct !== b.score.pct) {
      return b.score.pct - a.score.pct;
    }
    return a.dish.localeCompare(b.dish) || a.restaurant.localeCompare(b.restaurant);
  });
}

export function paginate<T>(items: T[], limit: number, offset: number): T[] {
  return items.slice(offset, offset + limit);
}

/** Clamps a caller-supplied limit into a sane range. */
export function parseLimit(raw: string | null, fallback = 20, max = 100): number {
  const n = parseInt(raw ?? "", 10);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(n, max);
}

export function parseOffset(raw: string | null): number {
  const n = parseInt(raw ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

// --- duplicate detection ---------------------------------------------------

export type RestaurantCandidate = { id: string; name: string; neighborhood?: string | null };

/**
 * Near-duplicate venues, most similar first.
 *
 * The existing inline-create path in app/api/eat-this/dishes/route.ts dedupes
 * with an exact `_ilike` on the name, which catches "Plum Bistro" twice but not
 * "Plum Bistro Seattle" or "Plum". Agents produce exactly that kind of
 * near-miss, so the agent endpoint checks fuzzily and hands back candidates —
 * an agent can act on "did you mean Plum Bistro?" but not on a bare 409.
 */
export function findDuplicateCandidates(
  name: string,
  existing: RestaurantCandidate[],
  threshold = DUPLICATE_THRESHOLD
): RestaurantCandidate[] {
  const scored = existing
    .map((r) => ({ r, s: similarity(name, r.name) }))
    .filter(({ s }) => s >= threshold)
    .sort((a, b) => b.s - a.s);
  return scored.map(({ r }) => r);
}

/** Exact (case/whitespace-insensitive) name collision, which is always a reuse
 * rather than a suggestion. */
export function findExactMatch(
  name: string,
  existing: RestaurantCandidate[]
): RestaurantCandidate | null {
  const n = normalize(name);
  return existing.find((r) => normalize(r.name) === n) ?? null;
}
