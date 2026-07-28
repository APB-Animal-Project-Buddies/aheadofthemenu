import { test, expect } from "bun:test";
import { META_DESCRIPTION_MAX, truncateAtWord } from "./meta-text";

test("short text passes through untouched", () => {
  expect(truncateAtWord("A short description.")).toBe("A short description.");
});

test("text exactly at the limit is not truncated", () => {
  const exact = "a".repeat(META_DESCRIPTION_MAX);
  expect(truncateAtWord(exact)).toBe(exact);
});

test("truncation breaks on a word boundary, never mid-word", () => {
  const text = "made with cilantro, jalapenos, pickled carrots and daikon radish";
  const out = truncateAtWord(text, 30);
  expect(out.length).toBeLessThanOrEqual(30);
  expect(out.endsWith("…")).toBe(true);
  // Every word kept must be a whole word from the source.
  for (const w of out.replace("…", "").split(" ")) {
    expect(text).toContain(w);
  }
});

test("truncation strips dangling punctuation before the ellipsis", () => {
  expect(truncateAtWord("made with cilantro, jalapenos", 20)).toBe("made with cilantro…");
});

test("a single over-long word is hard-cut rather than emptied", () => {
  const out = truncateAtWord("supercalifragilisticexpialidocious", 10);
  expect(out).toBe("supercali…");
  expect(out.length).toBe(10);
});

test("whitespace is collapsed", () => {
  expect(truncateAtWord("too   many\n\nspaces")).toBe("too many spaces");
});

test("output never exceeds the requested max", () => {
  const long = "word ".repeat(200);
  for (const max of [10, 25, 80, META_DESCRIPTION_MAX]) {
    expect(truncateAtWord(long, max).length).toBeLessThanOrEqual(max);
  }
});

test("empty and whitespace-only input yield an empty string", () => {
  expect(truncateAtWord("")).toBe("");
  expect(truncateAtWord("   ")).toBe("");
});
