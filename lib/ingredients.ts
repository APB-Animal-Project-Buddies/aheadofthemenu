export function normalize(name: string): string {
  let s = name.toLowerCase().trim().replace(/\s+/g, " ");
  s = s.replace(/[\s-]/g, "");          // strip spaces & hyphens
  if (s.endsWith("es")) s = s.slice(0, -1);      // peaches -> peache
  else if (s.endsWith("s")) s = s.slice(0, -1);  // cashews -> cashew
  return s;
}

export function slug(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function buildSearchText(name: string, synonyms: string[]): string {
  // Index both spaced ("soy milk") and spaceless ("soymilk") forms of every token
  // so substring search matches spacing/hyphen variants. Deduped.
  const spaced = [name, ...synonyms].map((t) => t.toLowerCase().replace(/\s+/g, " ").trim()).filter(Boolean);
  const spaceless = spaced.map((t) => t.replace(/[\s-]/g, ""));
  return Array.from(new Set([...spaced, ...spaceless])).join(" ");
}

export type AddDecision = { action: "reuse"; id: string } | { action: "create"; id: string };

export function decideAdd(name: string, existingByNormKey: Map<string, string>): AddDecision {
  const key = normalize(name);
  const hit = existingByNormKey.get(key);
  if (hit) return { action: "reuse", id: hit };
  return { action: "create", id: `custom:${slug(name)}` };
}
