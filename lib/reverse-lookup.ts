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
/** Vote tallies per cohort. `meh` (the neutral 😐 vote) is optional so existing
 * two-field call sites stay valid; readers coalesce a missing `meh` to 0. */
export type VoteTotals = { up: number; meh?: number; down: number };

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
  const meh = t.meh ?? 0;
  const total = t.up + meh + t.down;
  // A "meh" vote counts as half — it pulls a dish toward the middle band.
  return total === 0 ? 0 : Math.round((100 * (t.up + 0.5 * meh)) / total);
}

export type MeterState =
  | { state: "scored"; pct: number; votes: number; tier: Tier }
  | { state: "tallying"; votes: number }
  | { state: "empty" };

export function meterState(t: VoteTotals): MeterState {
  const votes = t.up + (t.meh ?? 0) + t.down;
  if (votes === 0) return { state: "empty" };
  if (votes < MIN_VOTES_TO_SCORE) return { state: "tallying", votes };
  const pct = scorePct(t);
  return { state: "scored", pct, votes, tier: tierFor(pct) };
}

export type VoteRow = { value: number; voter_kind: string; customization?: string | null };
export type CohortTotals = { locals: VoteTotals; visitors: VoteTotals; total: number };

function tally(bucket: VoteTotals, value: number) {
  if (value > 0) bucket.up += 1;
  else if (value < 0) bucket.down += 1;
  else bucket.meh = (bucket.meh ?? 0) + 1;
}

export function aggregateVotes(rows: VoteRow[]): CohortTotals {
  const locals: VoteTotals = { up: 0, meh: 0, down: 0 };
  const visitors: VoteTotals = { up: 0, meh: 0, down: 0 };
  for (const r of rows) tally(r.voter_kind === "visitor" ? visitors : locals, r.value);
  return { locals, visitors, total: rows.length };
}

/** Per-customization cohort totals — the input for rating breakdowns by customization. */
export type CustomizationTotals = Record<string, { locals: VoteTotals; visitors: VoteTotals }>;

export function aggregateByCustomization(rows: VoteRow[]): CustomizationTotals {
  const out: CustomizationTotals = {};
  for (const r of rows) {
    const c = r.customization;
    if (!c) continue; // unspecified votes count toward overall only
    const entry = out[c] ?? (out[c] = { locals: { up: 0, meh: 0, down: 0 }, visitors: { up: 0, meh: 0, down: 0 } });
    tally(r.voter_kind === "visitor" ? entry.visitors : entry.locals, r.value);
  }
  return out;
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
  d.locals.up + (d.locals.meh ?? 0) + d.locals.down +
  d.visitors.up + (d.visitors.meh ?? 0) + d.visitors.down;

export const overallTotals = (d: ScorableDish): VoteTotals => ({
  up: d.locals.up + d.visitors.up,
  meh: (d.locals.meh ?? 0) + (d.visitors.meh ?? 0),
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

export type MyVote = { value: 1 | 0 | -1; isLocal: boolean; customization?: string | null } | null;
export type VotableDish = { locals: VoteTotals; visitors: VoteTotals; myVote: MyVote };

/** Pure optimistic-vote transition: the caller's previous vote leaves its old
 * cohort/direction first, then the new vote (null = removal) lands in its
 * cohort. The server's fresh totals reconcile afterwards. */
export function applyVote<T extends VotableDish>(dish: T, value: 1 | 0 | -1 | null, isLocal: boolean): T {
  const strip = (t: VoteTotals, v: 1 | 0 | -1): VoteTotals =>
    v > 0 ? { ...t, up: Math.max(0, t.up - 1) }
    : v < 0 ? { ...t, down: Math.max(0, t.down - 1) }
    : { ...t, meh: Math.max(0, (t.meh ?? 0) - 1) };
  const add = (t: VoteTotals, v: 1 | 0 | -1): VoteTotals =>
    v > 0 ? { ...t, up: t.up + 1 }
    : v < 0 ? { ...t, down: t.down + 1 }
    : { ...t, meh: (t.meh ?? 0) + 1 };

  let { locals, visitors } = dish;
  if (dish.myVote) {
    if (dish.myVote.isLocal) locals = strip(locals, dish.myVote.value);
    else visitors = strip(visitors, dish.myVote.value);
  }
  if (value !== null) {
    if (isLocal) locals = add(locals, value);
    else visitors = add(visitors, value);
  }
  return { ...dish, locals, visitors, myVote: value === null ? null : { value, isLocal } };
}

/** Name-adjacency pass for search results: same-named dishes at different
 * venues sit together, each group at its highest-sorted member's position. */
export function groupByName<T extends { name: string }>(sorted: T[]): T[] {
  const groups = new Map<string, T[]>();
  for (const d of sorted) {
    const key = d.name.trim().toLowerCase();
    const g = groups.get(key);
    if (g) g.push(d);
    else groups.set(key, [d]);
  }
  return Array.from(groups.values()).flat();
}

/** Whitespace-split lowercase search tokens. */
export function tokenize(query: string): string[] {
  return query.trim().toLowerCase().split(/\s+/).filter(Boolean);
}

export type SearchableDish = {
  name: string;
  description: string | null;
  tags: string[];
  details?: { ingredients?: string[] } | null;
  restaurantName: string;
  location?: { neighborhood: string | null } | null;
};

/** Token-AND matching: every token must appear somewhere in the haystack, so
 * "chocolate milkshake" matches a Milkshake with a chocolate ingredient. */
export function dishMatchesTokens(d: SearchableDish, tokens: string[]): boolean {
  if (tokens.length === 0) return true;
  const haystack = [
    d.name,
    d.description ?? "",
    ...d.tags,
    ...(d.details?.ingredients ?? []),
    d.restaurantName,
    d.location?.neighborhood ?? "",
  ].join(" ").toLowerCase();
  return tokens.every((t) => haystack.includes(t));
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
  availability: DishAvailability;
  customizations: string[];
};

/** Parse a free-form string list (tags, customizations): strings only, trimmed,
 * length-capped, de-blanked, and truncated to `max` entries. */
export function strList(v: unknown, itemMax: number, max: number): string[] {
  return Array.isArray(v)
    ? v.filter((t): t is string => typeof t === "string").map((t) => str(t, itemMax)).filter(Boolean).slice(0, max)
    : [];
}

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

  const availability: DishAvailability = body?.availability === "seasonal" ? "seasonal" : "permanent";
  const customizations = strList(body?.customizations, 60, 20);
  return { restaurantId, newRestaurant, name, description: str(body?.description, 500) || null, tags, availability, customizations };
}

export type VoteInput = { value: 1 | 0 | -1 | null; voterKind: VoterKind; customization: string | null };

export function validateVote(body: any): VoteInput | { error: string } {
  const value = body?.value;
  if (value !== 1 && value !== 0 && value !== -1 && value !== null) {
    return { error: "value must be 1, 0, -1, or null" };
  }
  const raw = typeof body?.customization === "string" ? body.customization.trim() : "";
  const customization = raw ? raw.slice(0, 60) : null;
  return { value, voterKind: body?.isLocal === false ? "visitor" : "local", customization };
}

// --- availability, reports, comments ---------------------------------------

export type DishAvailability = "permanent" | "seasonal";

export type ReportReason = "not_on_menu" | "not_vegan" | "wrong_allergens" | "wrong_info" | "other";
export type ReportInput = { reason: ReportReason; note: string | null };
const REPORT_REASONS: ReportReason[] = ["not_on_menu", "not_vegan", "wrong_allergens", "wrong_info", "other"];

export function validateReport(body: any): ReportInput | { error: string } {
  const reason = body?.reason;
  if (!REPORT_REASONS.includes(reason)) return { error: "Invalid report reason" };
  const note = str(body?.note, 1000) || null;
  // Free-text "other" is meaningless without a note; require one.
  if (reason === "other" && !note) return { error: "Please describe the problem" };
  return { reason, note };
}

export type CommentVisibility = "public" | "private_to_restaurant";
export type CommentInput = { body: string; visibility: CommentVisibility };

export function validateComment(body: any): CommentInput | { error: string } {
  const text = str(body?.body, 600);
  if (!text) return { error: "Comment can't be empty" };
  const visibility: CommentVisibility =
    body?.visibility === "private_to_restaurant" ? "private_to_restaurant" : "public";
  return { body: text, visibility };
}

/** Fields a user may suggest editing on a dish (v1). */
export type DishEditProposed = {
  name?: string;
  description?: string | null;
  tags?: string[];
  availability?: DishAvailability;
  customizations?: string[];
};
export type DishEditInput = { proposed: DishEditProposed; note: string | null };

/**
 * Validates a proposed dish edit — only the fields actually present are included,
 * so a proposal can touch just one field. At least one editable field is required.
 */
export function validateDishEdit(body: any): DishEditInput | { error: string } {
  const proposed: DishEditProposed = {};

  if (body?.name !== undefined) {
    const name = str(body.name, 120);
    if (!name) return { error: "Dish name can't be empty" };
    if (String(body.name).trim().length > 120) return { error: "Dish name is too long" };
    proposed.name = name;
  }
  if (body?.description !== undefined) {
    proposed.description = str(body.description, 500) || null;
  }
  if (body?.tags !== undefined) {
    if (!Array.isArray(body.tags)) return { error: "Tags must be a list" };
    proposed.tags = body.tags
      .filter((t: unknown) => typeof t === "string")
      .map((t: string) => str(t, 40))
      .filter(Boolean)
      .slice(0, 12);
  }
  if (body?.availability !== undefined) {
    proposed.availability = body.availability === "seasonal" ? "seasonal" : "permanent";
  }
  if (body?.customizations !== undefined) {
    if (!Array.isArray(body.customizations)) return { error: "Customizations must be a list" };
    proposed.customizations = strList(body.customizations, 60, 20);
  }

  if (Object.keys(proposed).length === 0) return { error: "Nothing to change" };
  const note = str(body?.note, 1000) || null;
  return { proposed, note };
}
