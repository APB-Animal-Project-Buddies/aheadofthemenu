import { describe, test, expect } from "bun:test";
import {
  MIN_VOTES_TO_SCORE, scorePct, meterState, tierFor,
  aggregateVotes,
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
