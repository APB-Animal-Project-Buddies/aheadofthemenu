import { test, expect } from "bun:test";
import {
  LIKED_OPTIONS,
  isCommentRequired,
  buildReviewData,
  randomShortCode,
  generateUniqueShortCode,
  isValidShortCode,
  parseDishTarget,
} from "./reviews";

test("buildReviewData maps a substitution choice to {key, score}", () => {
  expect(buildReviewData({ rating: 6, expectations: 6, substitution: "much_better" } as any).substitution)
    .toEqual({ key: "much_better", score: 2 });
  expect(buildReviewData({ rating: 6, expectations: 6, substitution: "equal" } as any).substitution)
    .toEqual({ key: "equal", score: 0 });
  expect(buildReviewData({ rating: 6, expectations: 6, substitution: "much_worse" } as any).substitution)
    .toEqual({ key: "much_worse", score: -2 });
});

test("buildReviewData captures a known diet and ignores unknown ones", () => {
  expect(buildReviewData({ rating: 6, expectations: 6, reviewer: { diet: "vegan" } } as any).reviewer)
    .toEqual({ diet: "vegan" });
  expect(buildReviewData({ rating: 6, expectations: 6, reviewer: { diet: "bogus" } } as any).reviewer)
    .toBeUndefined();
});

test("buildReviewData carries free-text dietOther only when diet is other", () => {
  expect(buildReviewData({ rating: 6, expectations: 6, reviewer: { diet: "other", dietOther: "Raw vegan" } } as any).reviewer)
    .toEqual({ diet: "other", dietOther: "Raw vegan" });
  // dietOther ignored unless diet === "other"
  expect(buildReviewData({ rating: 6, expectations: 6, reviewer: { diet: "omnivore", dietOther: "ignored" } } as any).reviewer)
    .toEqual({ diet: "omnivore" });
});

test("buildReviewData omits substitution for N/A or unknown values", () => {
  expect("substitution" in buildReviewData({ rating: 6, expectations: 6, substitution: "na" } as any)).toBe(false);
  expect("substitution" in buildReviewData({ rating: 6, expectations: 6 } as any)).toBe(false);
  expect("substitution" in buildReviewData({ rating: 6, expectations: 6, substitution: "bogus" } as any)).toBe(false);
});

test("comment required only for extreme overall ratings", () => {
  expect(isCommentRequired(1)).toBe(true);
  expect(isCommentRequired(2)).toBe(true);
  expect(isCommentRequired(10)).toBe(true);
  expect(isCommentRequired(3)).toBe(false);
  expect(isCommentRequired(9)).toBe(false);
});

test("buildReviewData reconstructs only allowed fields", () => {
  const result = buildReviewData({
    rating: 8, expectations: 7,
    liked: ["taste", "texture", "bogus"],
    disliked: ["seasoning", "bogus"],
    comments: "Great",
    reviewer: { name: "VA", email: "va@example.com", evil: "x" },
    injected: "drop tables",
  } as any);
  expect(result).toEqual({
    rating: 8, expectations: 7,
    liked: ["taste", "texture"],
    disliked: ["seasoning"],
    comments: "Great",
    reviewer: { name: "VA", email: "va@example.com" },
  });
});

test("buildReviewData throws on out-of-range rating", () => {
  expect(() => buildReviewData({ rating: 0, expectations: 5 } as any)).toThrow();
  expect(() => buildReviewData({ rating: 11, expectations: 5 } as any)).toThrow();
});

test("buildReviewData throws when comment required but missing", () => {
  expect(() => buildReviewData({ rating: 1, expectations: 5, comments: "" } as any)).toThrow(/comment/i);
});

test("buildReviewData rejects malformed email when provided", () => {
  expect(() => buildReviewData({ rating: 5, expectations: 5, reviewer: { email: "nope" } } as any)).toThrow(/email/i);
});

test("randomShortCode is 5 base-36 chars", () => {
  expect(/^[a-z0-9]{5}$/.test(randomShortCode())).toBe(true);
});

test("generateUniqueShortCode retries until exists? returns false", () => {
  let calls = 0;
  const code = generateUniqueShortCode(() => calls++ < 2);
  expect(/^[a-z0-9]{5}$/.test(code)).toBe(true);
  expect(calls).toBe(3);
});

test("generateUniqueShortCode throws after maxAttempts", () => {
  expect(() => generateUniqueShortCode(() => true, 3)).toThrow();
});

test("isValidShortCode", () => {
  expect(isValidShortCode("aG3k9")).toBe(false);
  expect(isValidShortCode("ag3k9")).toBe(true);
  expect(isValidShortCode("")).toBe(false);
  expect(isValidShortCode("../etc")).toBe(false);
});

test("parseDishTarget only accepts dish_review with int target_id", () => {
  expect(parseDishTarget({ target_type: "dish_review", target_id: "42" })).toBe(42);
  expect(parseDishTarget({ target_type: "dish_review", target_id: "x" })).toBeNull();
  expect(parseDishTarget({ target_type: "other", target_id: "42" })).toBeNull();
  expect(parseDishTarget(null)).toBeNull();
});

test("LIKED_OPTIONS is the fixed allowlist", () => {
  expect(LIKED_OPTIONS).toEqual(["taste", "texture", "seasoning", "appearance", "aroma"]);
});
