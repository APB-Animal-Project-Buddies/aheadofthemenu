import { test, expect } from "bun:test";
import { MIN_VOTES_TO_SCORE, type VoteRow } from "./eat-this";
import {
  DUPLICATE_THRESHOLD,
  agentScore,
  applyFilters,
  dishUrl,
  findDuplicateCandidates,
  findExactMatch,
  matchesQuery,
  paginate,
  parseLimit,
  parseOffset,
  rankResults,
  toSearchResult,
  toTagList,
  type SearchResult,
  type SearchableDish,
} from "./eat-this-agent";

const votes = (up: number, meh = 0, down = 0): VoteRow[] => [
  ...Array.from({ length: up }, () => ({ value: 1, voter_kind: "local" })),
  ...Array.from({ length: meh }, () => ({ value: 0, voter_kind: "local" })),
  ...Array.from({ length: down }, () => ({ value: -1, voter_kind: "local" })),
];

const dish = (over: Partial<SearchableDish> = {}): SearchableDish => ({
  id: "d1",
  name: "Mac & Yease",
  description: "Cashew cheese elbows",
  tags: ["comfort", "cheesy"],
  availability: "permanent",
  restaurantId: "r1",
  restaurantName: "Plum Bistro",
  neighborhood: "Capitol Hill",
  votes: [],
  ...over,
});

// --- agentScore ------------------------------------------------------------

test("agentScore reports empty with no votes", () => {
  expect(agentScore([])).toEqual({ state: "empty" });
});

test("agentScore withholds the percentage below the vote floor", () => {
  const s = agentScore(votes(MIN_VOTES_TO_SCORE - 1));
  expect(s.state).toBe("tallying");
  // The whole point: no pct field at all, so an agent cannot quote a number the
  // UI deliberately hides.
  expect(s).not.toHaveProperty("pct");
});

test("agentScore starts scoring exactly at the vote floor", () => {
  const s = agentScore(votes(MIN_VOTES_TO_SCORE));
  expect(s.state).toBe("scored");
  if (s.state === "scored") {
    expect(s.pct).toBe(100);
    expect(s.votes).toBe(MIN_VOTES_TO_SCORE);
  }
});

test("agentScore counts a meh as half, matching the UI", () => {
  // 4 up, 2 meh, 0 down => (4 + 1) / 6 = 83%
  const s = agentScore(votes(4, 2, 0));
  if (s.state === "scored") expect(s.pct).toBe(83);
  else throw new Error("expected scored");
});

test("agentScore carries the tier label", () => {
  const s = agentScore(votes(10));
  if (s.state === "scored") expect(s.tier).toBe("Top Bite");
  else throw new Error("expected scored");
});

test("agentScore counts downvotes", () => {
  const s = agentScore(votes(5, 0, 5));
  if (s.state === "scored") expect(s.pct).toBe(50);
  else throw new Error("expected scored");
});

// --- toTagList / toSearchResult -------------------------------------------

test("toTagList keeps strings and drops everything else", () => {
  expect(toTagList(["a", 1, null, "b", {}])).toEqual(["a", "b"]);
});

test("toTagList returns [] for non-arrays", () => {
  for (const v of [null, undefined, "a", 5, {}]) expect(toTagList(v)).toEqual([]);
});

test("toSearchResult carries a citable url", () => {
  expect(toSearchResult(dish()).url).toBe(dishUrl("d1"));
  expect(toSearchResult(dish()).url).toBe("https://www.aheadofthemenu.com/eat-this/d1");
});

test("dishUrl deep-links to the per-dish page, not the catalogue", () => {
  // These URLs are published in agent output, /llms.txt and the OpenAPI doc, so
  // they must match a real route — app/eat-this/[id]/page.tsx.
  expect(dishUrl("abc-123")).toBe("https://www.aheadofthemenu.com/eat-this/abc-123");
});

test("toSearchResult exposes both ids so a vote can be made without a second lookup", () => {
  const r = toSearchResult(dish());
  expect(r.dishId).toBe("d1");
  expect(r.restaurantId).toBe("r1");
});

// --- matchesQuery ----------------------------------------------------------

test.each([
  ["mac", true],
  ["MAC", true],
  ["yease", true],
  ["plum", true], // restaurant name
  ["comfort", true], // tag
  ["cashew", true], // description
  ["sushi", false],
] as Array<[string, boolean]>)("matchesQuery(%p) === %p", (q: string, expected: boolean) => {
  expect(matchesQuery(dish(), q)).toBe(expected);
});

test("matchesQuery matches everything on an empty query", () => {
  expect(matchesQuery(dish(), "")).toBe(true);
  expect(matchesQuery(dish(), "   ")).toBe(true);
});

test("matchesQuery tolerates a null description", () => {
  expect(matchesQuery(dish({ description: null }), "mac")).toBe(true);
  expect(matchesQuery(dish({ description: null }), "cashew")).toBe(false);
});

// --- applyFilters ----------------------------------------------------------

const catalog = [
  dish(),
  dish({ id: "d2", name: "Jackfruit Tacos", description: null, tags: ["spicy"], neighborhood: "Ballard", restaurantName: "No Bones" }),
  dish({ id: "d3", name: "Cashew Curry", description: null, tags: ["comfort", "spicy"], neighborhood: "Ballard", restaurantName: "No Bones" }),
];

test("applyFilters with no filters is a pass-through", () => {
  expect(applyFilters(catalog, {})).toHaveLength(3);
});

test("applyFilters filters by neighborhood", () => {
  expect(applyFilters(catalog, { neighborhood: "ballard" }).map((d) => d.id)).toEqual(["d2", "d3"]);
});

test("applyFilters requires ALL tags, not any", () => {
  expect(applyFilters(catalog, { tags: ["comfort", "spicy"] }).map((d) => d.id)).toEqual(["d3"]);
});

test("applyFilters combines q and neighborhood", () => {
  expect(applyFilters(catalog, { q: "cashew", neighborhood: "Ballard" }).map((d) => d.id)).toEqual(["d3"]);
});

test("applyFilters returns [] when nothing matches", () => {
  expect(applyFilters(catalog, { q: "ramen" })).toEqual([]);
});

test("applyFilters ignores blank filter values", () => {
  expect(applyFilters(catalog, { q: "  ", neighborhood: "", tags: [] })).toHaveLength(3);
});

// --- rankResults -----------------------------------------------------------

const result = (over: Partial<SearchResult>): SearchResult => ({
  ...toSearchResult(dish()),
  ...over,
});

test("rankResults puts scored dishes before tallying before empty", () => {
  const input = [
    result({ dishId: "empty", dish: "C", score: { state: "empty" } }),
    result({ dishId: "tally", dish: "B", score: { state: "tallying", votes: 2 } }),
    result({ dishId: "scored", dish: "A", score: { state: "scored", pct: 50, votes: 9, tier: "Skip" } }),
  ];
  expect(rankResults(input).map((r) => r.dishId)).toEqual(["scored", "tally", "empty"]);
});

test("rankResults orders scored dishes by percentage descending", () => {
  const input = [
    result({ dishId: "low", score: { state: "scored", pct: 60, votes: 9, tier: "Meh" } }),
    result({ dishId: "high", score: { state: "scored", pct: 95, votes: 9, tier: "Top Bite" } }),
  ];
  expect(rankResults(input).map((r) => r.dishId)).toEqual(["high", "low"]);
});

test("rankResults breaks ties deterministically so paging is stable", () => {
  const tie = (name: string) => result({ dishId: name, dish: name, score: { state: "empty" } });
  const a = rankResults([tie("Zucchini"), tie("Apple"), tie("Mango")]).map((r) => r.dish);
  const b = rankResults([tie("Mango"), tie("Zucchini"), tie("Apple")]).map((r) => r.dish);
  expect(a).toEqual(b);
  expect(a).toEqual(["Apple", "Mango", "Zucchini"]);
});

test("rankResults does not mutate its input", () => {
  const input = [
    result({ dishId: "b", score: { state: "empty" } }),
    result({ dishId: "a", score: { state: "scored", pct: 90, votes: 9, tier: "Top Bite" } }),
  ];
  const before = input.map((r) => r.dishId);
  rankResults(input);
  expect(input.map((r) => r.dishId)).toEqual(before);
});

// --- pagination ------------------------------------------------------------

test("paginate slices by limit and offset", () => {
  expect(paginate([1, 2, 3, 4, 5], 2, 1)).toEqual([2, 3]);
});

test("paginate past the end returns []", () => {
  expect(paginate([1, 2], 10, 50)).toEqual([]);
});

test.each([
  ["20", 20],
  ["1", 1],
  ["500", 100], // clamped to max
  ["0", 20], // falls back
  ["-5", 20],
  ["abc", 20],
  [null, 20],
] as Array<[string | null, number]>)("parseLimit(%p) === %p", (raw: string | null, expected: number) => {
  expect(parseLimit(raw)).toBe(expected);
});

test.each([
  ["0", 0],
  ["10", 10],
  ["-1", 0],
  ["abc", 0],
  [null, 0],
] as Array<[string | null, number]>)("parseOffset(%p) === %p", (raw: string | null, expected: number) => {
  expect(parseOffset(raw)).toBe(expected);
});

// --- duplicate detection ---------------------------------------------------

const existing = [
  { id: "r1", name: "Plum Bistro", neighborhood: "Capitol Hill" },
  { id: "r2", name: "No Bones Beach Club", neighborhood: "Ballard" },
  { id: "r3", name: "Harvest Beat", neighborhood: "Fremont" },
];

test("findExactMatch is case and whitespace insensitive", () => {
  expect(findExactMatch("plum bistro", existing)?.id).toBe("r1");
  expect(findExactMatch("  Plum   Bistro ", existing)?.id).toBe("r1");
});

test("findExactMatch returns null for a genuinely new name", () => {
  expect(findExactMatch("Cafe Flora", existing)).toBeNull();
});

test("findDuplicateCandidates catches the near-miss the _ilike path misses", () => {
  // This is the case the browser route's exact-match dedupe lets through.
  const hits = findDuplicateCandidates("Plum Bistro Seattle", existing);
  expect(hits[0]?.id).toBe("r1");
});

test("findDuplicateCandidates returns [] for a genuinely distinct venue", () => {
  expect(findDuplicateCandidates("Cafe Flora", existing)).toEqual([]);
});

test("findDuplicateCandidates orders by similarity, closest first", () => {
  const pool = [
    { id: "far", name: "Plum Tree Cafe and Bakery" },
    { id: "near", name: "Plum Bistro" },
  ];
  const hits = findDuplicateCandidates("Plum Bistro", pool, 0.3);
  expect(hits[0].id).toBe("near");
});

test("findDuplicateCandidates respects a custom threshold", () => {
  const loose = findDuplicateCandidates("Plum", existing, 0.1);
  const strict = findDuplicateCandidates("Plum", existing, 0.99);
  expect(loose.length).toBeGreaterThan(strict.length);
});

test("findDuplicateCandidates finds an exact name too", () => {
  expect(findDuplicateCandidates("Plum Bistro", existing)[0].id).toBe("r1");
});

test("findDuplicateCandidates on an empty catalog returns []", () => {
  expect(findDuplicateCandidates("Anything", [])).toEqual([]);
});

test("DUPLICATE_THRESHOLD matches lib/fuzzy's tuned default", () => {
  expect(DUPLICATE_THRESHOLD).toBe(0.72);
});
