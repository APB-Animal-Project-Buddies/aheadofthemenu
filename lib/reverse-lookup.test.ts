import { describe, test, expect } from "bun:test";
import {
  MIN_VOTES_TO_SCORE, scorePct, meterState, tierFor,
  aggregateVotes, rankLeaderboard, leaderboardCategories, sortDishCards,
  parseSvgCsv, validateAddDish, validateVote,
} from "./reverse-lookup";

describe("scorePct", () => {
  test("rounds up/(up+down) to a whole percent", () => {
    expect(scorePct({ up: 2, down: 1 })).toBe(67);
    expect(scorePct({ up: 0, down: 5 })).toBe(0);
    expect(scorePct({ up: 5, down: 0 })).toBe(100);
  });
});

describe("meterState", () => {
  test("empty below 1 vote", () => {
    expect(meterState({ up: 0, down: 0 })).toEqual({ state: "empty" });
  });
  test("tallying below MIN_VOTES_TO_SCORE — no pct exposed", () => {
    const s = meterState({ up: 3, down: 1 });
    expect(s).toEqual({ state: "tallying", votes: 4 });
  });
  test("scored at the threshold", () => {
    const s = meterState({ up: 4, down: 1 });
    expect(s.state).toBe("scored");
    if (s.state === "scored") {
      expect(s.pct).toBe(80);
      expect(s.votes).toBe(5);
      expect(s.tier.label).toBe("Yum");
    }
  });
});

describe("tierFor", () => {
  test("tier boundaries match the sample", () => {
    expect(tierFor(90).label).toBe("Top Bite");
    expect(tierFor(89).label).toBe("Yum");
    expect(tierFor(79).label).toBe("Tasty");
    expect(tierFor(69).label).toBe("Meh");
    expect(tierFor(54).label).toBe("Skip");
  });
});

describe("aggregateVotes", () => {
  test("splits rows into local/visitor cohorts", () => {
    const rows = [
      { value: 1, voter_kind: "local" },
      { value: 1, voter_kind: "local" },
      { value: -1, voter_kind: "visitor" },
    ];
    expect(aggregateVotes(rows)).toEqual({
      locals: { up: 2, down: 0 },
      visitors: { up: 0, down: 1 },
      total: 3,
    });
  });
});

const dish = (over: object) => ({
  id: "d1", name: "Pie", tags: ["pizza"],
  locals: { up: 0, down: 0 }, visitors: { up: 0, down: 0 },
  createdAt: "2026-07-01T00:00:00Z",
  ...over,
});

describe("rankLeaderboard", () => {
  test("requires MIN_VOTES_TO_SCORE total votes to rank", () => {
    const d1 = dish({ id: "a", locals: { up: 4, down: 0 } });            // 4 votes — out
    const d2 = dish({ id: "b", locals: { up: 3, down: 2 } });            // 5 votes — in
    expect(rankLeaderboard([d1, d2], "pizza").map((d) => d.id)).toEqual(["b"]);
  });
  test("ranks by overall pct across ALL votes, desc", () => {
    const low  = dish({ id: "low",  locals: { up: 3, down: 2 } });               // 60%
    const high = dish({ id: "high", locals: { up: 4, down: 0 }, visitors: { up: 1, down: 0 } }); // 100%
    expect(rankLeaderboard([low, high], "pizza").map((d) => d.id)).toEqual(["high", "low"]);
  });
  test("filters by tag", () => {
    const pizza = dish({ id: "p", locals: { up: 5, down: 0 } });
    const burger = dish({ id: "b", tags: ["burger"], locals: { up: 5, down: 0 } });
    expect(rankLeaderboard([pizza, burger], "burger").map((d) => d.id)).toEqual(["b"]);
  });
});

describe("leaderboardCategories", () => {
  test("a tag qualifies with ≥ 2 rankable dishes", () => {
    const a = dish({ id: "a", locals: { up: 5, down: 0 } });
    const b = dish({ id: "b", locals: { up: 5, down: 0 } });
    const c = dish({ id: "c", tags: ["burger"], locals: { up: 5, down: 0 } });
    expect(leaderboardCategories([a, b, c])).toEqual(["pizza"]);
  });
});

describe("sortDishCards", () => {
  test("scored dishes first by pct desc, then tallying by votes desc then newest", () => {
    const scored = dish({ id: "s", locals: { up: 5, down: 0 } });
    const tallyBig = dish({ id: "tb", locals: { up: 3, down: 0 } });
    const tallyNew = dish({ id: "tn", locals: { up: 1, down: 0 }, createdAt: "2026-07-04T00:00:00Z" });
    const tallyOld = dish({ id: "to", locals: { up: 1, down: 0 }, createdAt: "2026-07-01T00:00:00Z" });
    expect(sortDishCards([tallyOld, tallyNew, tallyBig, scored]).map((d) => d.id))
      .toEqual(["s", "tb", "tn", "to"]);
  });
});

describe("parseSvgCsv", () => {
  const csv = [
    "name,website,types,address_1,address_2,address_3,address_4,neighborhood_1,neighborhood_2,neighborhood_3,neighborhood_4,phone_1,phone_2,phone_3,phone_4,instagram,facebook,description,last_verified",
    `Araya's Place,https://www.arayasplace.com,Thai,"5240 University Way NE, Seattle, WA 98105","10246 Main St, Bellevue, WA",,,U-District,Eastside,,,(206) 524-4332,(425) 454-2440,,,https://instagram.com/a,https://facebook.com/b,"Classic Thai — curries, and ""more"".",2026-06-29`,
    "Box Bar,https://boxbarseattle.com,American | Bar,\"5401 California Ave SW, Seattle, WA\",,,,West Seattle,,,,(206) 432-9554,,,,,,Casual spot.,2026-06-29",
  ].join("\n");

  test("parses quoted fields, positional locations, pipe-split cuisines", () => {
    const rows = parseSvgCsv(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0].name).toBe("Araya's Place");
    expect(rows[0].cuisines).toEqual(["Thai"]);
    expect(rows[0].description).toContain('and "more"');
    expect(rows[0].locations).toEqual([
      { address: "5240 University Way NE, Seattle, WA 98105", neighborhood: "U-District", phone: "(206) 524-4332" },
      { address: "10246 Main St, Bellevue, WA", neighborhood: "Eastside", phone: "(425) 454-2440" },
    ]);
    expect(rows[1].cuisines).toEqual(["American", "Bar"]);
    expect(rows[1].locations[0].phone).toBe("(206) 432-9554");
    expect(rows[0].lastVerified).toBe("2026-06-29");
  });
});

describe("validateAddDish", () => {
  test("accepts an existing-restaurant body", () => {
    const v = validateAddDish({ restaurantId: "3e9a2f6c-0000-0000-0000-000000000000", name: "Katsu Curry", tags: ["curry"] });
    expect("error" in v).toBe(false);
  });
  test("accepts an inline new restaurant", () => {
    const v = validateAddDish({ newRestaurant: { name: "New Spot", address: "1 Main St" }, name: "Pie" });
    expect("error" in v).toBe(false);
  });
  test("rejects missing dish name / missing venue / oversized fields / non-UUID id", () => {
    const uuid = "3e9a2f6c-0000-0000-0000-000000000000";
    expect(validateAddDish({ restaurantId: uuid, name: "" })).toHaveProperty("error");
    expect(validateAddDish({ name: "Pie" })).toHaveProperty("error");
    expect(validateAddDish({ newRestaurant: { name: "A", address: "" }, name: "Pie" })).toHaveProperty("error");
    expect(validateAddDish({ restaurantId: uuid, name: "a".repeat(121) })).toHaveProperty("error");
    expect(validateAddDish({ restaurantId: "not-a-uuid", name: "Pie" })).toHaveProperty("error");
  });
  test("caps tags at 12 and drops non-strings", () => {
    const uuid = "3e9a2f6c-0000-0000-0000-000000000000";
    const v = validateAddDish({ restaurantId: uuid, name: "Pie", tags: [...Array(20).keys()].map(String).concat([3 as any]) });
    expect("error" in v).toBe(false);
    if ("error" in v) throw new Error("unreachable");
    expect(v.tags).toHaveLength(12);
  });
});

describe("validateVote", () => {
  test("accepts 1, -1, null; isLocal defaults true", () => {
    expect(validateVote({ value: 1 })).toEqual({ value: 1, voterKind: "local" });
    expect(validateVote({ value: -1, isLocal: false })).toEqual({ value: -1, voterKind: "visitor" });
    expect(validateVote({ value: null })).toEqual({ value: null, voterKind: "local" });
  });
  test("rejects other values", () => {
    expect(validateVote({ value: 2 })).toHaveProperty("error");
    expect(validateVote({})).toHaveProperty("error");
  });
});
