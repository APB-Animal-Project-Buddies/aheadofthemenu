"use client";

/**
 * Agent API key management for the signed-in user.
 *
 * This component is the reason we don't need to be an OAuth authorization
 * server: there is no third party in the trust chain — a signed-in user mints a
 * credential for themselves and pastes it into their own agent.
 *
 * The raw key is returned exactly once (only its SHA-256 is stored), so the UI
 * has to make that unmissable.
 */
import { useCallback, useEffect, useState } from "react";
import { authFetch } from "@/lib/nhost/auth-fetch";
import { ALL_SCOPES, DEFAULT_SCOPES, type AgentScope } from "@/lib/agent-scopes";

type KeyRow = {
  id: string;
  name: string;
  scopes: string[] | null;
  expires_at: string | null;
  last_used_at: string | null;
  revoked_at: string | null;
  created_at: string;
};

const SCOPE_HELP: Record<AgentScope, string> = {
  "eat-this:read": "Search dishes and look up restaurants",
  "eat-this:write": "Add restaurants and dishes",
  "eat-this:comment": "Comment on dishes",
  "eat-this:vote": "Vote on dishes — affects public scores",
};

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";

export function AgentKeysSection() {
  const [keys, setKeys] = useState<KeyRow[] | null>(null);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<AgentScope[]>(DEFAULT_SCOPES);
  const [freshKey, setFreshKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await authFetch("/api/agent-keys");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Couldn't load your keys");
      setKeys(data.keys ?? []);
    } catch (e) {
      setError((e as Error).message);
      setKeys([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleScope = (s: AgentScope) =>
    setScopes((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));

  const create = async () => {
    if (!name.trim() || !scopes.length) return;
    setBusy(true);
    setError("");
    try {
      const res = await authFetch("/api/agent-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), scopes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Couldn't create that key");
      setFreshKey(data.key);
      setName("");
      setScopes(DEFAULT_SCOPES);
      setCreating(false);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (id: string, keyName: string) => {
    if (!window.confirm(`Revoke "${keyName}"? Any agent using it stops working immediately.`)) return;
    setBusy(true);
    try {
      const res = await authFetch(`/api/agent-keys/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Couldn't revoke that key");
      }
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!freshKey) return;
    try {
      await navigator.clipboard.writeText(freshKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the value is on screen to select manually */
    }
  };

  const active = (keys ?? []).filter((k) => !k.revoked_at);
  const revoked = (keys ?? []).filter((k) => k.revoked_at);

  return (
    <section className="mt-8">
      <h2 className="font-serif text-lg font-semibold text-apb">API keys for AI agents</h2>
      <p className="mt-1 text-sm text-neutral-600">
        Let an AI assistant add restaurants, dishes, and ratings to Eat This! on your behalf.
        Everything it writes is attributed to you.{" "}
        <a href="/llms.txt" className="underline hover:text-apb" target="_blank" rel="noreferrer">
          How it works
        </a>
      </p>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {freshKey && (
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">
            Copy this now — it will never be shown again.
          </p>
          <p className="mt-1 text-xs text-amber-800">
            Only a hash is stored, so we can&apos;t recover it for you. If you lose it, revoke the
            key and make another.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <code className="flex-1 overflow-x-auto rounded-lg bg-white px-3 py-2 font-mono text-xs text-neutral-800">
              {freshKey}
            </code>
            <button
              type="button"
              onClick={copy}
              className="rounded-full border border-amber-400 px-3 py-1.5 text-sm font-medium text-amber-900 transition hover:bg-amber-100"
            >
              {copied ? "Copied" : "Copy"}
            </button>
            <button
              type="button"
              onClick={() => setFreshKey(null)}
              className="text-sm text-amber-800 hover:underline"
            >
              Done
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        {keys === null ? (
          <p className="px-6 py-5 text-sm text-neutral-500">Loading…</p>
        ) : active.length === 0 && revoked.length === 0 ? (
          <p className="px-6 py-5 text-sm text-neutral-500">You haven&apos;t created any keys yet.</p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {[...active, ...revoked].map((k) => (
              <li key={k.id} className="flex flex-wrap items-start justify-between gap-3 px-6 py-4">
                <div className="min-w-0">
                  <p className="font-medium text-neutral-800">
                    {k.name}
                    {k.revoked_at && (
                      <span className="ml-2 rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
                        revoked
                      </span>
                    )}
                  </p>
                  <p className="mt-1 flex flex-wrap gap-1.5">
                    {(k.scopes ?? []).map((s) => (
                      <span
                        key={s}
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          s === "eat-this:vote"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-neutral-100 text-neutral-600"
                        }`}
                      >
                        {s}
                      </span>
                    ))}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    Created {fmt(k.created_at)} · Last used {fmt(k.last_used_at)}
                    {k.expires_at ? ` · Expires ${fmt(k.expires_at)}` : ""}
                  </p>
                </div>
                {!k.revoked_at && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => revoke(k.id, k.name)}
                    className="rounded-full border border-neutral-200 px-3 py-1 text-sm font-medium text-neutral-700 transition hover:border-red-300 hover:text-red-600 disabled:opacity-60"
                  >
                    Revoke
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="border-t border-neutral-100 px-6 py-4">
          {!creating ? (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:border-apb-accent hover:text-apb"
            >
              Create a key
            </button>
          ) : (
            <div className="space-y-3">
              <label className="block">
                <span className="text-sm font-medium text-neutral-700">What is it for?</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={60}
                  placeholder="e.g. Claude on my laptop"
                  className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-apb-accent focus:outline-none"
                />
              </label>

              <fieldset>
                <legend className="text-sm font-medium text-neutral-700">What can it do?</legend>
                <div className="mt-1 space-y-1.5">
                  {ALL_SCOPES.map((s) => (
                    <label key={s} className="flex items-start gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={scopes.includes(s)}
                        onChange={() => toggleScope(s)}
                        className="mt-1"
                      />
                      <span>
                        <span className="text-neutral-800">{SCOPE_HELP[s]}</span>
                        {s === "eat-this:vote" && (
                          <span className="ml-1 text-xs text-amber-700">
                            — off by default; votes feed the public Yum-Meter
                          </span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={create}
                  disabled={busy || !name.trim() || !scopes.length}
                  className="rounded-full bg-apb px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  {busy ? "Creating…" : "Create key"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCreating(false);
                    setName("");
                    setScopes(DEFAULT_SCOPES);
                  }}
                  className="text-sm text-neutral-500 hover:underline"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
