/**
 * lib/meta-text.ts
 *
 * Text shaping for <meta description> and OG tags. Kept pure and separate so
 * both detail pages (/dishes/[id], /eat-this/[id]) truncate identically and the
 * behaviour is testable.
 */

/** Google truncates search snippets around here; longer text is wasted. */
export const META_DESCRIPTION_MAX = 160;

/**
 * Truncates to at most `max` characters on a word boundary, appending an
 * ellipsis when anything was removed.
 *
 * A plain slice() cuts mid-word and leaves dangling punctuation ("made with
 * cilantro, jalapen"), which is what search engines then display.
 */
export function truncateAtWord(input: string, max = META_DESCRIPTION_MAX): string {
  const text = input.replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;

  // Budget leaves room for the ellipsis.
  const budget = max - 1;
  let body = text.slice(0, budget);

  // Only walk back to the previous space if we actually landed mid-word. If the
  // next character is a space the final word is complete, and dropping it would
  // throw away a word that fits.
  if (text[budget] !== " ") {
    const lastSpace = body.lastIndexOf(" ");
    // A single word longer than the limit has no space to break on; hard-cut it.
    if (lastSpace > 0) body = body.slice(0, lastSpace);
  }

  return `${body.replace(/[\s,;:.!?-]+$/, "")}…`;
}
