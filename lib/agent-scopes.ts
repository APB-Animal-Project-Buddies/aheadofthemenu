/**
 * lib/agent-scopes.ts
 *
 * Scope vocabulary for agent API keys. Split out from lib/agent-keys so the
 * client-side key manager can import it without dragging node:crypto (and the
 * server-only GraphQL client) into the browser bundle.
 */

export type AgentScope =
  | "eat-this:read"
  | "eat-this:write"
  | "eat-this:comment"
  | "eat-this:vote";

export const ALL_SCOPES: AgentScope[] = [
  "eat-this:read",
  "eat-this:write",
  "eat-this:comment",
  "eat-this:vote",
];

/** Scopes a freshly created key gets unless the user opts into more. Voting is
 * excluded on purpose: it is the one write that feeds the public ranking. */
export const DEFAULT_SCOPES: AgentScope[] = [
  "eat-this:read",
  "eat-this:write",
  "eat-this:comment",
];

export function isScope(value: unknown): value is AgentScope {
  return typeof value === "string" && (ALL_SCOPES as string[]).includes(value);
}

/** Filters arbitrary input down to known scopes: deduped, canonically ordered,
 * unknown entries dropped rather than rejected. */
export function sanitizeScopes(input: unknown): AgentScope[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<AgentScope>();
  for (const s of input) if (isScope(s)) seen.add(s);
  return ALL_SCOPES.filter((s) => seen.has(s));
}

export function hasScope(caller: { scopes: string[] }, scope: AgentScope): boolean {
  return caller.scopes.includes(scope);
}
