import { test, expect } from "bun:test";
import {
  KM_PER_MILE,
  distanceKm,
  distanceMiles,
  formatDistance,
  parseCoords,
  sortByDistance,
  type Coords,
} from "./geo";

// Real Seattle landmarks, so the expected distances are checkable by hand.
const PIKE_PLACE: Coords = { lat: 47.6097, lng: -122.3422 };
const SPACE_NEEDLE: Coords = { lat: 47.6205, lng: -122.3493 };
const CAPITOL_HILL: Coords = { lat: 47.6229, lng: -122.3212 };
const BALLARD: Coords = { lat: 47.6685, lng: -122.3843 };

// --- parseCoords -----------------------------------------------------------

test("parses numbers", () => {
  expect(parseCoords(47.6, -122.3)).toEqual({ lat: 47.6, lng: -122.3 });
});

test("parses strings — LocationIQ returns lat/lon as strings", () => {
  expect(parseCoords("44.945405", "15.6348663")).toEqual({
    lat: 44.945405,
    lng: 15.6348663,
  });
});

test("0,0 is a valid point, not a missing value", () => {
  expect(parseCoords(0, 0)).toEqual({ lat: 0, lng: 0 });
  expect(parseCoords("0", "0")).toEqual({ lat: 0, lng: 0 });
});

test("a half pair is rejected outright", () => {
  // Guards the failure this exists to prevent: a missing lng read as 0 would
  // place a Seattle restaurant in the Gulf of Guinea.
  expect(parseCoords(47.6, null)).toBeNull();
  expect(parseCoords(null, -122.3)).toBeNull();
  expect(parseCoords(47.6, undefined)).toBeNull();
  expect(parseCoords(47.6, "")).toBeNull();
});

test.each([
  [91, 0],
  [-91, 0],
  [0, 181],
  [0, -181],
] as Array<[number, number]>)("rejects out-of-range %p,%p", (la: number, ln: number) => {
  expect(parseCoords(la, ln)).toBeNull();
});

test("rejects junk", () => {
  for (const v of ["abc", {}, [], true, NaN, Infinity]) {
    expect(parseCoords(v, 0)).toBeNull();
  }
});

// --- distanceKm ------------------------------------------------------------

test("distance to self is zero", () => {
  expect(distanceKm(PIKE_PLACE, PIKE_PLACE)).toBe(0);
});

test("Pike Place → Space Needle is about 1.31 km", () => {
  // Straight-line; the real-world walk is longer.
  expect(distanceKm(PIKE_PLACE, SPACE_NEEDLE)).toBeCloseTo(1.31, 2);
});

test("Pike Place → Capitol Hill is about 2.2 km", () => {
  expect(distanceKm(PIKE_PLACE, CAPITOL_HILL)).toBeCloseTo(2.2, 1);
});

test("distance is symmetric", () => {
  expect(distanceKm(PIKE_PLACE, BALLARD)).toBeCloseTo(distanceKm(BALLARD, PIKE_PLACE), 10);
});

test("obeys the triangle inequality", () => {
  const direct = distanceKm(PIKE_PLACE, BALLARD);
  const viaNeedle = distanceKm(PIKE_PLACE, SPACE_NEEDLE) + distanceKm(SPACE_NEEDLE, BALLARD);
  expect(direct).toBeLessThanOrEqual(viaNeedle + 1e-9);
});

test("handles antipodal points without NaN", () => {
  // asin() of a value nudged past 1 by floating point would return NaN; the
  // Math.min(1, …) clamp is what stops that.
  const d = distanceKm({ lat: 0, lng: 0 }, { lat: 0, lng: 180 });
  expect(Number.isFinite(d)).toBe(true);
  expect(d).toBeCloseTo(Math.PI * 6371, 0);
});

test("crosses the antimeridian correctly", () => {
  // 179°E to 179°W is 2° apart, not 358°.
  const d = distanceKm({ lat: 0, lng: 179 }, { lat: 0, lng: -179 });
  expect(d).toBeLessThan(250);
});

test("miles conversion matches the constant", () => {
  const km = distanceKm(PIKE_PLACE, BALLARD);
  expect(distanceMiles(PIKE_PLACE, BALLARD)).toBeCloseTo(km / KM_PER_MILE, 10);
});

// --- formatDistance --------------------------------------------------------

test.each([
  [0.05, "mi", "164 ft"],   // 0.05 km = 0.031 mi = 164 ft
  [1.6, "mi", "1.0 mi"],
  [32.2, "mi", "20 mi"],
] as Array<[number, "mi", string]>)("formatDistance(%p, %p) === %p", (km: number, unit: "mi", out: string) => {
  expect(formatDistance(km, unit)).toBe(out);
});

test("formats metric", () => {
  expect(formatDistance(0.05, "km")).toBe("50 m");
  expect(formatDistance(2.5, "km")).toBe("2.5 km");
  expect(formatDistance(42, "km")).toBe("42 km");
});

// --- sortByDistance --------------------------------------------------------

type Row = { id: string; c: Coords | null };
const coordsOf = (r: Row) => r.c;

test("orders nearest first", () => {
  const rows: Row[] = [
    { id: "ballard", c: BALLARD },
    { id: "needle", c: SPACE_NEEDLE },
    { id: "caphill", c: CAPITOL_HILL },
  ];
  expect(sortByDistance(rows, PIKE_PLACE, coordsOf).map((r) => r.id)).toEqual([
    "needle",
    "caphill",
    "ballard",
  ]);
});

test("attaches the computed distance", () => {
  const out = sortByDistance([{ id: "needle", c: SPACE_NEEDLE }], PIKE_PLACE, coordsOf);
  expect(out[0].distanceKm).toBeCloseTo(1.31, 2);
});

test("ungeocoded rows sort last but are NOT dropped", () => {
  const rows: Row[] = [
    { id: "unknown", c: null },
    { id: "ballard", c: BALLARD },
    { id: "needle", c: SPACE_NEEDLE },
  ];
  const out = sortByDistance(rows, PIKE_PLACE, coordsOf);
  expect(out.map((r) => r.id)).toEqual(["needle", "ballard", "unknown"]);
  expect(out).toHaveLength(3); // nothing silently disappears
  expect(out[2].distanceKm).toBeNull();
});

test("ungeocoded rows keep their original relative order", () => {
  const rows: Row[] = [
    { id: "a", c: null },
    { id: "b", c: null },
    { id: "c", c: null },
  ];
  expect(sortByDistance(rows, PIKE_PLACE, coordsOf).map((r) => r.id)).toEqual(["a", "b", "c"]);
});

test("equal distances keep their original order (stable)", () => {
  const rows: Row[] = [
    { id: "first", c: SPACE_NEEDLE },
    { id: "second", c: SPACE_NEEDLE },
  ];
  expect(sortByDistance(rows, PIKE_PLACE, coordsOf).map((r) => r.id)).toEqual(["first", "second"]);
});

test("does not mutate the input array", () => {
  const rows: Row[] = [{ id: "ballard", c: BALLARD }, { id: "needle", c: SPACE_NEEDLE }];
  const before = rows.map((r) => r.id);
  sortByDistance(rows, PIKE_PLACE, coordsOf);
  expect(rows.map((r) => r.id)).toEqual(before);
});

test("empty input returns empty", () => {
  expect(sortByDistance([], PIKE_PLACE, coordsOf)).toEqual([]);
});
