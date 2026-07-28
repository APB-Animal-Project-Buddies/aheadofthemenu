import { test, expect, describe } from "bun:test";
import { normalize, levenshtein, similarity, fuzzyMatches, closestMatch } from "./fuzzy";

// Mirrors the kind of near-duplicate rows the dedupe pass cleaned up.
const CREATORS = [
  "Nora Cooks",
  "Vegan Richa",
  "Rainbow Plant Life",
  "The Korean Vegan",
  "School Night Vegan",
  "Minimalist Baker",
  "Pick Up Limes",
];

describe("normalize", () => {
  test("lowercases, strips accents + punctuation, collapses whitespace", () => {
    expect(normalize("  Nöra's   Cooks!! ")).toBe("nora s cooks");
    expect(normalize("Chez Jorge")).toBe("chez jorge");
    expect(normalize("BOSH.TV")).toBe("bosh tv");
  });

  test("empty / punctuation-only collapses to empty string", () => {
    expect(normalize("")).toBe("");
    expect(normalize("   ")).toBe("");
    expect(normalize("—!!—")).toBe("");
  });

  test("is idempotent", () => {
    const once = normalize("Añejo & Co.");
    expect(normalize(once)).toBe(once);
  });
});

describe("levenshtein", () => {
  test("zero for identical, length for empty operand", () => {
    expect(levenshtein("nora", "nora")).toBe(0);
    expect(levenshtein("", "nora")).toBe(4);
    expect(levenshtein("nora", "")).toBe(4);
  });

  test("counts single edits (insert / delete / substitute)", () => {
    expect(levenshtein("nora", "noraa")).toBe(1); // insert
    expect(levenshtein("noora", "nora")).toBe(1); // delete
    expect(levenshtein("nora", "nara")).toBe(1); // substitute
    expect(levenshtein("kitten", "sitting")).toBe(3); // classic
  });

  test("is symmetric", () => {
    expect(levenshtein("vegan richa", "veganricha")).toBe(levenshtein("veganricha", "vegan richa"));
  });
});

describe("similarity", () => {
  test("1.0 for strings equal after normalization", () => {
    expect(similarity("Nora Cooks", "nora  cooks")).toBe(1);
    expect(similarity("BOSH.TV", "bosh tv")).toBe(1);
  });

  test("0 when either side is empty", () => {
    expect(similarity("", "nora")).toBe(0);
    expect(similarity("nora", "")).toBe(0);
    expect(similarity("!!", "nora")).toBe(0);
  });

  test("high for token reorder / subset", () => {
    expect(similarity("korean vegan", "The Korean Vegan")).toBeGreaterThanOrEqual(0.6);
    expect(similarity("richa vegan", "Vegan Richa")).toBeGreaterThanOrEqual(0.6);
  });

  test("high for small typos, low for unrelated names", () => {
    expect(similarity("Noora Cooks", "Nora Cooks")).toBeGreaterThan(0.8);
    expect(similarity("Gordon Ramsay", "Nora Cooks")).toBeLessThan(0.34);
  });

  test("symmetric", () => {
    expect(similarity("nora cook", "Nora Cooks")).toBe(similarity("Nora Cooks", "nora cook"));
  });
});

describe("fuzzyMatches", () => {
  test("empty query returns the first N options unchanged", () => {
    expect(fuzzyMatches("", CREATORS, 3)).toEqual(CREATORS.slice(0, 3));
  });

  test("ranks the intended creator first", () => {
    expect(fuzzyMatches("veganricha", CREATORS)[0]).toBe("Vegan Richa");
    expect(fuzzyMatches("nora cook", CREATORS)[0]).toBe("Nora Cooks");
    expect(fuzzyMatches("rainbow", CREATORS)[0]).toBe("Rainbow Plant Life");
    expect(fuzzyMatches("korean", CREATORS)[0]).toBe("The Korean Vegan");
  });

  test("prefix matches outrank mid-string matches", () => {
    // "vegan" appears in three names; the one starting with it should win.
    expect(fuzzyMatches("vegan", CREATORS)[0]).toBe("Vegan Richa");
  });

  test("respects the limit", () => {
    expect(fuzzyMatches("vegan", CREATORS, 2).length).toBeLessThanOrEqual(2);
  });

  test("filters out low-similarity noise", () => {
    expect(fuzzyMatches("xyzzy qwerty", CREATORS)).toEqual([]);
  });

  test("case + punctuation insensitive", () => {
    expect(fuzzyMatches("MINIMALIST baker!!", CREATORS)[0]).toBe("Minimalist Baker");
  });
});

describe("closestMatch", () => {
  test("suggests a near-duplicate", () => {
    expect(closestMatch("Nora Cook", CREATORS)).toBe("Nora Cooks");
    expect(closestMatch("noora cooks", CREATORS)).toBe("Nora Cooks");
    expect(closestMatch("korean vegan", CREATORS)).toBe("The Korean Vegan");
  });

  test("returns null on an exact (normalized) match — nothing to correct", () => {
    expect(closestMatch("Nora Cooks", CREATORS)).toBeNull();
    expect(closestMatch("nora   cooks", CREATORS)).toBeNull();
  });

  test("returns null when nothing is close enough", () => {
    expect(closestMatch("Gordon Ramsay", CREATORS)).toBeNull();
    expect(closestMatch("", CREATORS)).toBeNull();
  });

  test("a substring of a creator name is treated as a strong match", () => {
    // The substring bonus is intentional (it powers autocomplete), so a bare
    // token that appears in a name resolves to it even at the default threshold.
    expect(closestMatch("vegan", CREATORS)).toBe("Vegan Richa");
  });

  test("threshold controls strictness for a mid-similarity typo", () => {
    // "Rainbow Plnt" is NOT a substring of any name, so it scores in the middle
    // band — accepted just below its score, rejected just above it.
    const q = "Rainbow Plnt";
    const s = similarity(q, "Rainbow Plant Life");
    expect(s).toBeGreaterThan(0.34);
    expect(s).toBeLessThan(1);
    expect(closestMatch(q, CREATORS, s + 0.05)).toBeNull();
    expect(closestMatch(q, CREATORS, s - 0.05)).toBe("Rainbow Plant Life");
  });
});
