import { test, expect } from "bun:test";
import { cleanDescription, fixSuspects, suspects } from "./description-clean";

test("adds the missing space after a full stop", () => {
  expect(cleanDescription("made with cilantro, and more.jalapenos, picked carrots")).toBe(
    "made with cilantro, and more. jalapenos, picked carrots"
  );
});

test("strips a dangling trailing comma", () => {
  expect(cleanDescription("picked carrots & daikon,")).toBe("picked carrots & daikon");
});

test("strips a trailing comma followed by a space", () => {
  expect(cleanDescription("a sandwich, ")).toBe("a sandwich");
});

test("adds the missing space after a comma", () => {
  expect(cleanDescription("cilantro,jalapenos")).toBe("cilantro, jalapenos");
});

test("removes space before punctuation", () => {
  expect(cleanDescription("carrots , daikon")).toBe("carrots, daikon");
});

test("collapses repeated punctuation", () => {
  expect(cleanDescription("carrots,, daikon")).toBe("carrots, daikon");
});

test("collapses runs of whitespace", () => {
  expect(cleanDescription("too   many\n\nspaces")).toBe("too many spaces");
});

test("leaves already-clean text untouched", () => {
  const clean = "A crispy seitan sandwich with pickled carrots and daikon.";
  expect(cleanDescription(clean)).toBe(clean);
});

test("does not break decimals", () => {
  expect(cleanDescription("about 1.5 cups of sauce")).toBe("about 1.5 cups of sauce");
});

test("does not split a domain name", () => {
  expect(cleanDescription("see example.com for details")).toBe("see example.com for details");
});

test("preserves sentence breaks that already have a space", () => {
  expect(cleanDescription("Hearty. Filling. Good.")).toBe("Hearty. Filling. Good.");
});

test("keeps a sentence-ending full stop", () => {
  // Only separators are stripped from the end, not terminal punctuation.
  expect(cleanDescription("A great sandwich.")).toBe("A great sandwich.");
});

test("is idempotent", () => {
  const messy = "made with cilantro, and more.jalapenos , picked carrots & daikon,";
  const once = cleanDescription(messy);
  expect(cleanDescription(once)).toBe(once);
});

test("empty input stays empty", () => {
  expect(cleanDescription("")).toBe("");
  expect(cleanDescription("   ")).toBe("");
});

test("suspect wording is reported, never rewritten", () => {
  const text = "sandwich with picked carrots";
  expect(cleanDescription(text)).toBe(text);
  expect(suspects(text)[0]).toContain("pickled");
});

test("suspects finds nothing in clean text", () => {
  expect(suspects("A crispy seitan sandwich with pickled carrots.")).toEqual([]);
});

// --- fixSuspects (explicit wording changes) --------------------------------

test("fixSuspects corrects picked → pickled, keeping the following noun", () => {
  expect(fixSuspects("sandwich with picked carrots & daikon")).toBe(
    "sandwich with pickled carrots & daikon"
  );
});

test("fixSuspects preserves leading capitalisation", () => {
  expect(fixSuspects("Picked carrots are great")).toBe("Pickled carrots are great");
});

test("fixSuspects leaves unrelated uses of 'picked' alone", () => {
  // Only the food-noun pattern matches, so this stays put.
  const s = "hand picked mushrooms";
  expect(fixSuspects(s)).toBe(s);
});

test("fixSuspects is idempotent", () => {
  const once = fixSuspects("picked carrots");
  expect(fixSuspects(once)).toBe(once);
});

test("fixSuspects leaves clean text untouched", () => {
  const clean = "A crispy seitan sandwich with pickled carrots.";
  expect(fixSuspects(clean)).toBe(clean);
});

test("does not mangle emoticons into punctuation", () => {
  // Regression: "crunchy :)" became "crunchy:)" and silently rewrote an
  // author's voice. Caught by auditing production before writing to it.
  expect(cleanDescription("tender, and crunchy :) They're gluten-free.")).toBe(
    "tender, and crunchy :) They're gluten-free."
  );
});

test.each([":)", ":(", ":-)", ":D", ";)", ":P", ":o"])(
  "preserves the space before the emoticon %s",
  (face: string) => {
    expect(cleanDescription(`so good ${face} really`)).toBe(`so good ${face} really`);
  }
);

test("still removes a space before real punctuation", () => {
  expect(cleanDescription("carrots , daikon and radish .")).toBe("carrots, daikon and radish.");
});

// --- multi-word corrections + diacritics ------------------------------------

test("fixSuspects corrects 'ban minh' to 'bánh mì' with no leftover words", () => {
  // Regression: the old first-word-only replacement produced "bánh mì minh".
  expect(fixSuspects("Delicious ban minh filled with seitan")).toBe(
    "Delicious bánh mì filled with seitan"
  );
});

test("fixSuspects adds diacritics to an otherwise correct 'banh mi'", () => {
  expect(fixSuspects("a classic banh mi")).toBe("a classic bánh mì");
});

test("fixSuspects leaves an already-correct 'bánh mì' alone", () => {
  const s = "a classic bánh mì";
  expect(fixSuspects(s)).toBe(s);
});

test("banh mi correction is idempotent", () => {
  const once = fixSuspects("ban minh");
  expect(fixSuspects(once)).toBe(once);
  expect(once).toBe("bánh mì");
});

test("fixSuspects preserves capitalisation on a multi-word correction", () => {
  expect(fixSuspects("Ban minh is great")).toBe("Bánh mì is great");
});

test("the picked lookahead still spares unrelated uses", () => {
  expect(fixSuspects("hand picked mushrooms")).toBe("hand picked mushrooms");
  expect(fixSuspects("picked carrots")).toBe("pickled carrots");
});
