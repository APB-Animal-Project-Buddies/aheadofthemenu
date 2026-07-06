/**
 * lib/reverse-lookup.ts
 *
 * Pure logic for the reverse-lookup catalog: Yum-Meter score math, mood
 * tiers, leaderboard ranking, seed-CSV parsing, and API request validation.
 * No network, no framework imports — everything here is bun-testable.
 */

/** One knob for score confidence: below this many votes a cohort shows
 * "Still tallying…" with NO percentage (early numbers would anchor voters). */
export const MIN_VOTES_TO_SCORE = 5;

export type VoterKind = "local" | "visitor";
export type VoteTotals = { up: number; down: number };

export type Tier = {
  key: "love" | "yum" | "tasty" | "meh" | "skip";
  label: string;
  color: string;
  soft: string;
  face: "love" | "happy" | "smile" | "neutral" | "sad";
};

// Boundaries and palette from the user's Yum Lookup sample (moodFor).
export function tierFor(pct: number): Tier {
  if (pct >= 90) return { key: "love",  label: "Top Bite", color: "#3F8F5A", soft: "#E8F2EA", face: "love" };
  if (pct >= 80) return { key: "yum",   label: "Yum",      color: "#6BA84A", soft: "#EEF3E0", face: "happy" };
  if (pct >= 70) return { key: "tasty", label: "Tasty",    color: "#CFA017", soft: "#FAF1D2", face: "smile" };
  if (pct >= 55) return { key: "meh",   label: "Meh",      color: "#D17B3A", soft: "#FCE9D9", face: "neutral" };
  return { key: "skip", label: "Skip", color: "#C95B4F", soft: "#FBDDD7", face: "sad" };
}

export function scorePct(t: VoteTotals): number {
  const total = t.up + t.down;
  return total === 0 ? 0 : Math.round((100 * t.up) / total);
}

export type MeterState =
  | { state: "scored"; pct: number; votes: number; tier: Tier }
  | { state: "tallying"; votes: number }
  | { state: "empty" };

export function meterState(t: VoteTotals): MeterState {
  const votes = t.up + t.down;
  if (votes === 0) return { state: "empty" };
  if (votes < MIN_VOTES_TO_SCORE) return { state: "tallying", votes };
  const pct = scorePct(t);
  return { state: "scored", pct, votes, tier: tierFor(pct) };
}

export type VoteRow = { value: number; voter_kind: string };
export type CohortTotals = { locals: VoteTotals; visitors: VoteTotals; total: number };

export function aggregateVotes(rows: VoteRow[]): CohortTotals {
  const locals = { up: 0, down: 0 };
  const visitors = { up: 0, down: 0 };
  for (const r of rows) {
    const bucket = r.voter_kind === "visitor" ? visitors : locals;
    if (r.value > 0) bucket.up += 1;
    else bucket.down += 1;
  }
  return { locals, visitors, total: rows.length };
}
