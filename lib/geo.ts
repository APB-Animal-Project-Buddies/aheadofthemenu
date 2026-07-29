/**
 * lib/geo.ts
 *
 * Coordinate parsing and great-circle distance. Pure — no network, no framework —
 * matching the split used by lib/eat-this.ts and lib/fuzzy.ts.
 *
 * Distance is computed in application code rather than in Postgres. See the
 * 1785200000000_restaurant_location_coords migration for why: Hasura can filter
 * by distance natively (_st_d_within) but cannot ORDER BY it without a tracked
 * SQL function, and /api/eat-this/catalog already returns the whole city in one
 * query — so at this size sorting here costs nothing and needs no extension.
 */

export type Coords = { lat: number; lng: number };

export const EARTH_RADIUS_KM = 6371;
export const KM_PER_MILE = 1.609344;

/**
 * Parses coordinates from arbitrary input (LocationIQ returns them as STRINGS,
 * and Postgres NUMERIC comes back as a string through Hasura too). Returns null
 * for anything that isn't a usable point.
 *
 * 0,0 is treated as valid — it's a real point in the Gulf of Guinea — but a
 * half-pair is not, because distance code would otherwise read the missing half
 * as 0 and place the restaurant off the coast of Africa.
 */
export function parseCoords(lat: unknown, lng: unknown): Coords | null {
  const toNum = (v: unknown): number | null => {
    if (typeof v === "number") return Number.isFinite(v) ? v : null;
    if (typeof v === "string" && v.trim() !== "") {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  };

  const la = toNum(lat);
  const ln = toNum(lng);
  if (la === null || ln === null) return null;
  if (la < -90 || la > 90 || ln < -180 || ln > 180) return null;
  return { lat: la, lng: ln };
}

const toRad = (deg: number) => (deg * Math.PI) / 180;

/**
 * Great-circle distance in kilometres (haversine).
 *
 * Treats the earth as a sphere, so it is off by up to ~0.5% against the
 * ellipsoid — metres over a city, which is far below the precision anyone reads
 * off a "0.4 mi away" label. PostGIS geography would be exact; it is not worth
 * an extension for this.
 */
export function distanceKm(a: Coords, b: Coords): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export const distanceMiles = (a: Coords, b: Coords) => distanceKm(a, b) / KM_PER_MILE;

/** Human label for a distance, in the unit the caller asks for. */
export function formatDistance(km: number, unit: "km" | "mi" = "mi"): string {
  const v = unit === "mi" ? km / KM_PER_MILE : km;
  if (v < 0.1) return `${Math.round(v * (unit === "mi" ? 5280 : 1000))} ${unit === "mi" ? "ft" : "m"}`;
  if (v < 10) return `${v.toFixed(1)} ${unit}`;
  return `${Math.round(v)} ${unit}`;
}

/**
 * Sorts items by distance from `origin`, nearest first.
 *
 * Items WITHOUT coordinates sort last rather than being dropped — an
 * ungeocoded restaurant is still a real restaurant, and silently hiding it
 * would make the catalog look smaller than it is. Ties and the ungeocoded tail
 * keep their original relative order (stable), so paging stays deterministic.
 */
export function sortByDistance<T>(
  items: T[],
  origin: Coords,
  coordsOf: (item: T) => Coords | null
): Array<T & { distanceKm: number | null }> {
  return items
    .map((item, i) => {
      const c = coordsOf(item);
      return { item, i, d: c ? distanceKm(origin, c) : null };
    })
    .sort((a, b) => {
      if (a.d === null && b.d === null) return a.i - b.i;
      if (a.d === null) return 1;
      if (b.d === null) return -1;
      return a.d - b.d || a.i - b.i;
    })
    .map(({ item, d }) => ({ ...item, distanceKm: d }));
}
