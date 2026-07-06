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

export type ScorableDish = {
  id: string;
  name: string;
  tags: string[];
  locals: VoteTotals;
  visitors: VoteTotals;
  createdAt: string;
};

const totalVotes = (d: ScorableDish) =>
  d.locals.up + d.locals.down + d.visitors.up + d.visitors.down;

export const overallTotals = (d: ScorableDish): VoteTotals => ({
  up: d.locals.up + d.visitors.up,
  down: d.locals.down + d.visitors.down,
});

/** Dishes with ≥ MIN_VOTES_TO_SCORE total votes, tag-filtered, by overall % desc. */
export function rankLeaderboard<T extends ScorableDish>(dishes: T[], tag: string): T[] {
  return dishes
    .filter((d) => d.tags.includes(tag) && totalVotes(d) >= MIN_VOTES_TO_SCORE)
    .sort((a, b) => scorePct(overallTotals(b)) - scorePct(overallTotals(a)) || totalVotes(b) - totalVotes(a));
}

/** Tags with at least 2 rankable dishes, alphabetical. */
export function leaderboardCategories(dishes: ScorableDish[]): string[] {
  const counts = new Map<string, number>();
  for (const d of dishes) {
    if (totalVotes(d) < MIN_VOTES_TO_SCORE) continue;
    for (const t of d.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return Array.from(counts.entries()).filter(([, n]) => n >= 2).map(([t]) => t).sort();
}

/** Dishes tab order: scored (pct desc), then still-tallying (votes desc, newest first). */
export function sortDishCards<T extends ScorableDish>(dishes: T[]): T[] {
  return [...dishes].sort((a, b) => {
    const aScored = totalVotes(a) >= MIN_VOTES_TO_SCORE;
    const bScored = totalVotes(b) >= MIN_VOTES_TO_SCORE;
    if (aScored !== bScored) return aScored ? -1 : 1;
    if (aScored) return scorePct(overallTotals(b)) - scorePct(overallTotals(a));
    return totalVotes(b) - totalVotes(a) || b.createdAt.localeCompare(a.createdAt);
  });
}

export type SeedLocation = { address: string; neighborhood: string | null; phone: string | null };
export type SeedRestaurant = {
  name: string;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  description: string | null;
  cuisines: string[];
  lastVerified: string | null;
  locations: SeedLocation[];
};

/** Minimal RFC-4180 CSV parser (quoted fields, "" escapes, LF/CRLF rows). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], field = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((f) => f !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((f) => f !== "")) rows.push(row);
  return rows;
}

export function parseSvgCsv(text: string): SeedRestaurant[] {
  const [header, ...rows] = parseCsv(text);
  const col = (name: string) => header.indexOf(name);
  const get = (r: string[], name: string) => (r[col(name)] ?? "").trim();
  return rows.map((r) => {
    const locations: SeedLocation[] = [];
    for (const n of [1, 2, 3, 4]) {
      const address = get(r, `address_${n}`);
      if (!address) continue;
      locations.push({
        address,
        neighborhood: get(r, `neighborhood_${n}`) || null,
        phone: get(r, `phone_${n}`) || null,
      });
    }
    return {
      name: get(r, "name"),
      website: get(r, "website") || null,
      instagram: get(r, "instagram") || null,
      facebook: get(r, "facebook") || null,
      description: get(r, "description") || null,
      cuisines: get(r, "types").split("|").map((s) => s.trim()).filter(Boolean),
      lastVerified: get(r, "last_verified") || null,
      locations,
    };
  }).filter((r) => r.name);
}

const str = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);

export type AddDishInput = {
  restaurantId: string | null;
  newRestaurant: { name: string; address: string; neighborhood: string | null; website: string | null } | null;
  name: string;
  description: string | null;
  tags: string[];
};

export function validateAddDish(body: any): AddDishInput | { error: string } {
  // The name is the dish's identity (dedup key) — truncating it would silently
  // change what gets matched, so overflow is rejected. Other fields (description,
  // tags, addresses) truncate silently: losing their tail is harmless.
  const name = str(body?.name, 120);
  if (!name) return { error: "Dish name is required" };
  if (String(body?.name ?? "").trim().length > 120) return { error: "Dish name is too long" };

  const tags = Array.isArray(body?.tags)
    ? body.tags.filter((t: unknown) => typeof t === "string").map((t: string) => str(t, 40)).filter(Boolean).slice(0, 12)
    : [];

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const restaurantId = body?.restaurantId ? String(body.restaurantId) : null;
  if (restaurantId && !UUID_RE.test(restaurantId)) return { error: "Invalid restaurant id" };
  let newRestaurant: AddDishInput["newRestaurant"] = null;
  if (!restaurantId) {
    const rn = str(body?.newRestaurant?.name, 120);
    const addr = str(body?.newRestaurant?.address, 300);
    if (!rn || !addr) return { error: "Pick a restaurant or give a new one a name and address" };
    let website = str(body?.newRestaurant?.website, 300) || null;
    if (website && !/^https?:\/\//i.test(website)) website = `https://${website}`;
    newRestaurant = { name: rn, address: addr, neighborhood: str(body?.newRestaurant?.neighborhood, 80) || null, website };
  }

  return { restaurantId, newRestaurant, name, description: str(body?.description, 500) || null, tags };
}

export type VoteInput = { value: 1 | -1 | null; voterKind: VoterKind };

export function validateVote(body: any): VoteInput | { error: string } {
  const value = body?.value;
  if (value !== 1 && value !== -1 && value !== null) return { error: "value must be 1, -1, or null" };
  return { value, voterKind: body?.isLocal === false ? "visitor" : "local" };
}
