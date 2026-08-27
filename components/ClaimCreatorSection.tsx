"use client";

/**
 * "Claim your creator page" — /profile section with four states, all living in
 * this one component (owner_id/claim status decide which renders):
 *
 *   1. search   — not claimed anything yet: fuzzy-search unclaimed creators
 *                 (same lib/fuzzy.ts pattern as CreatorCombobox) + a "create
 *                 your own" fallback form. The fallback requires a website/
 *                 channel link and blocks (routes to the claim modal instead
 *                 of submitting) when the typed name is a near-dup of an
 *                 existing unclaimed creator — it INSERTs an owned row with no
 *                 admin review, so it can't be a free pass around the claim
 *                 flow's evidence gate. Built here.
 *   2. modal    — "This is me" claim-request modal: requires an evidence link
 *                 (a URL to the claimant's channel/profile/press mention) and
 *                 POSTs to /api/creators/claims. Lives in
 *                 components/ClaimCreatorModal.tsx, opened from here.
 *   3. pending  — a claim is awaiting admin review: shows what was submitted
 *                 (evidence link/note, submitted date) plus a manual "Check
 *                 status" button that re-calls GET /api/creators/claims.
 *                 Built here.
 *   3b. rejected — the most recent claim (once nothing's pending) was
 *                 declined: an acknowledgment banner in place of the search
 *                 form, since silently dropping the user back to "search
 *                 again" gives no signal anything happened. "Try again"
 *                 dismisses it (client-only — a fresh page load will show it
 *                 again until the user re-claims or an admin's decision
 *                 changes) and returns to the search form. Built here.
 *   4. owned    — the caller already owns a creator profile: a small card
 *                 (display_name, image if set) linking out to the public
 *                 /creators/[slug] page. Built here.
 *
 * GET /api/creators/claims (Bearer) on mount decides which of the five states
 * applies: `owned` set -> 4, any claim with status "pending" -> 3, else the
 * most recent claim (claims come back ordered newest-first) being "rejected"
 * and not yet dismissed -> 3b, else -> 1.
 */
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { authFetch } from "@/lib/nhost/auth-fetch";
import { Input } from "@/components/ui/input";
import { closestMatch, fuzzyMatches } from "@/lib/fuzzy";
import { ClaimCreatorModal } from "@/components/ClaimCreatorModal";

type UnclaimedCreator = { id: string; display_name: string; creator_name: string | null; slug: string | null };
type ClaimRow = { id: string; creator_id: string; status: "pending" | "approved" | "rejected"; note: string | null; created_at: string; reviewed_at: string | null; creator: { id: string; display_name: string; slug: string | null } };
type OwnedCreator = { id: string; display_name: string; slug: string | null; image_url?: string | null };

type ClaimsState = { claims: ClaimRow[]; owned: OwnedCreator | null };

export function ClaimCreatorSection() {
  const { isAuthenticated } = useAuth();
  const [state, setState] = useState<ClaimsState | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Picking a creator opens the piece-2 modal preloaded with its id/name.
  const [modalCreator, setModalCreator] = useState<{ id: string; name: string } | null>(null);

  // "Owned" set locally right after a successful create-your-own POST, so the
  // section swaps to the piece-5 view immediately without waiting on a refetch.
  const [justOwned, setJustOwned] = useState<OwnedCreator | null>(null);

  // Client-only dismissal for the rejected-claim banner (piece 3b): once the
  // user acknowledges a decline, that claim id stops resurfacing the banner
  // for the rest of this session even though it's still the most recent
  // "rejected" row the API returns.
  const [dismissedRejectionId, setDismissedRejectionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await authFetch("/api/creators/claims");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Couldn't load your claim status");
      setState({ claims: data.claims ?? [], owned: data.owned ?? null });
    } catch (e) {
      setLoadError((e as Error).message);
      setState({ claims: [], owned: null });
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    void load();
  }, [isAuthenticated, load]);

  if (!isAuthenticated) return null;

  const owned = justOwned ?? state?.owned ?? null;
  const pending = state?.claims.find((c) => c.status === "pending") ?? null;
  // Claims come back newest-first, so the first "rejected" row (once nothing's
  // pending) is the most recent decision — the only one worth surfacing.
  // Skipped once the user has dismissed it for this specific claim id.
  const latestRejected = !pending ? state?.claims.find((c) => c.status === "rejected") ?? null : null;
  const rejected = latestRejected && latestRejected.id !== dismissedRejectionId ? latestRejected : null;

  return (
    <section className="mt-8">
      <h2 className="font-serif text-lg font-semibold text-apb">Your creator page</h2>

      {loadError && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{loadError}</p>
      )}

      {state === null && !loadError ? (
        <p className="mt-3 text-sm text-neutral-500">Loading…</p>
      ) : owned ? (
        <OwnedSummary creator={owned} />
      ) : pending ? (
        <PendingBanner claim={pending} onRefresh={load} />
      ) : rejected ? (
        <RejectedBanner claim={rejected} onDismiss={() => setDismissedRejectionId(rejected.id)} />
      ) : (
        <SearchAndCreate
          onClaimPicked={(c) => setModalCreator(c)}
          onOwned={(c) => setJustOwned(c)}
        />
      )}

      {modalCreator && (
        <ClaimCreatorModal
          creator={modalCreator}
          onClose={() => setModalCreator(null)}
          onSubmitted={() => {
            setModalCreator(null);
            void load();
          }}
        />
      )}
    </section>
  );
}

/** Piece 1 (this build): fuzzy search over unclaimed creators + "create your own" fallback. */
function SearchAndCreate({
  onClaimPicked,
  onOwned,
}: {
  onClaimPicked: (creator: { id: string; name: string }) => void;
  onOwned: (creator: OwnedCreator) => void;
}) {
  const [creators, setCreators] = useState<UnclaimedCreator[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/creators/unclaimed");
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Couldn't load creators");
        if (!cancelled) setCreators(data.creators ?? []);
      } catch (e) {
        if (!cancelled) {
          setLoadError((e as Error).message);
          setCreators([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const query = q.trim();
  // Same typo-tolerant ranking as CreatorCombobox, keyed by id so distinct
  // creators sharing a display_name don't collide.
  const byName = new Map((creators ?? []).map((c) => [c.display_name, c] as const));
  const names = fuzzyMatches(query, Array.from(byName.keys()), 8);
  const matches = names.map((n) => byName.get(n)!).filter(Boolean);

  return (
    <div className="mt-3">
      <p className="text-sm text-neutral-600">
        Search for your name or brand below. Already have dishes attributed to you? Claiming
        your page lets you edit your bio, photo, and social links.
      </p>

      <div className="relative mt-3">
        <Input
          value={q}
          placeholder="Search creators (e.g. Nora Cooks, Vegan Richa)"
          onChange={(e) => setQ(e.target.value)}
          disabled={creators === null}
        />
      </div>

      {creators === null && !loadError ? (
        <p className="mt-2 text-sm text-neutral-500">Loading creators…</p>
      ) : loadError ? (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{loadError}</p>
      ) : query && matches.length === 0 ? (
        <p className="mt-2 text-sm text-neutral-400">No matches — you can create your own page below.</p>
      ) : query ? (
        <ul className="mt-2 divide-y divide-neutral-100 overflow-hidden rounded-xl border border-neutral-200 bg-white">
          {matches.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-neutral-800">{c.display_name}</p>
                {c.creator_name && c.creator_name !== c.display_name && (
                  <p className="truncate text-xs text-neutral-500">{c.creator_name}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => onClaimPicked({ id: c.id, name: c.display_name })}
                className="shrink-0 rounded-full bg-apb px-3 py-1.5 text-xs font-medium text-white transition hover:bg-apb-light"
              >
                This is me →
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {!showCreate ? (
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="mt-3 text-xs font-medium text-apb hover:underline"
        >
          Don&rsquo;t see your page? Create your own instead
        </button>
      ) : (
        <CreateOwnForm
          onCancel={() => setShowCreate(false)}
          onOwned={onOwned}
          existingCreators={creators ?? []}
          onClaimInstead={onClaimPicked}
        />
      )}
    </div>
  );
}

function CreateOwnForm({
  onCancel,
  onOwned,
  existingCreators,
  onClaimInstead,
}: {
  onCancel: () => void;
  onOwned: (creator: OwnedCreator) => void;
  /** Unclaimed creators already fetched by the parent, for near-dup steering. */
  existingCreators: UnclaimedCreator[];
  /** Routes into the real (piece 2) claim modal instead of creating a near-dup row. */
  onClaimInstead: (creator: { id: string; name: string }) => void;
}) {
  const [displayName, setDisplayName] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Near-duplicate steering (same pattern as AddCreatorLine's "Did you mean?"):
  // this INSERTs an owned row immediately with no admin review, so a near-miss
  // of an existing unclaimed name must be blocked, not just warned about —
  // otherwise the create-own path is a way to walk around the claim flow's
  // evidence gate entirely.
  const nameMap = new Map<string, UnclaimedCreator>();
  for (const c of existingCreators) {
    if (c.creator_name) nameMap.set(c.creator_name, c);
    nameMap.set(c.display_name, c); // set last: display_name wins on collision
  }
  const optionNames = Array.from(nameMap.keys());
  const matchFor = (typed: string) => {
    const t = typed.trim();
    if (!t) return null;
    const m = closestMatch(t, optionNames);
    return m ? nameMap.get(m) ?? null : null;
  };
  const suggestion = matchFor(creatorName) ?? matchFor(displayName);

  async function create() {
    if (!displayName.trim()) {
      setMsg("Your name is required.");
      return;
    }
    if (!website.trim()) {
      setMsg("A website or channel link is required so this page is verifiable.");
      return;
    }
    if (suggestion) {
      setMsg(`That looks like an existing page (${suggestion.display_name}) — claim it instead of creating a new one.`);
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await authFetch("/api/creators/mine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, creatorName, website }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data?.error || "Couldn't create your page.");
        return;
      }
      onOwned({ id: data.creator.id, display_name: displayName.trim(), slug: data.creator.slug ?? null });
    } catch {
      setMsg("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 space-y-3 rounded-xl border border-neutral-200 bg-white p-4">
      <div>
        <label className="text-xs font-medium text-neutral-700">Your name (required)</label>
        <Input
          className="mt-1"
          placeholder="e.g. Nisha Vora"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          disabled={busy}
        />
      </div>
      <div>
        <label className="text-xs font-medium text-neutral-700">Creator/brand name (optional)</label>
        <Input
          className="mt-1"
          placeholder="e.g. Rainbow Plant Life"
          value={creatorName}
          onChange={(e) => setCreatorName(e.target.value)}
          disabled={busy}
        />
      </div>
      <div>
        <label className="text-xs font-medium text-neutral-700">Website or channel (required)</label>
        <Input
          className="mt-1"
          placeholder="rainbowplantlife.com"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          disabled={busy}
        />
        <p className="mt-1 text-xs text-neutral-400">
          Since this page goes live immediately, we need somewhere public that confirms it&rsquo;s yours.
        </p>
      </div>
      {suggestion && !busy ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Did you mean <strong>{suggestion.display_name}</strong>? It&rsquo;s already in our list, unclaimed.{" "}
          <button
            type="button"
            onClick={() => onClaimInstead({ id: suggestion.id, name: suggestion.display_name })}
            className="font-semibold text-apb underline"
          >
            Claim &ldquo;{suggestion.display_name}&rdquo; instead
          </button>
        </div>
      ) : null}
      {msg && <p className="text-xs text-red-600">{msg}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={create}
          disabled={busy || !!suggestion}
          className="flex-1 rounded-full bg-apb px-4 py-2 text-xs font-medium text-white transition hover:bg-apb-light disabled:opacity-50"
        >
          {busy ? "Creating…" : "Create my page"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="rounded-full border border-neutral-300 px-4 py-2 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/**
 * ClaimCreatorModal submits note as "{evidenceUrl}\n\n{freeform note}" (note
 * optional) — split back apart so the link renders as a link and any
 * free-text context isn't glued into the href. Shared by PendingBanner and
 * RejectedBanner (and mirrored in app/admin/edits/page.jsx's ClaimEditCard,
 * the one other place this note format gets displayed).
 */
function splitEvidence(note: string | null) {
  const [evidenceUrl, ...rest] = (note ?? "").split("\n\n");
  return { evidenceUrl, extraNote: rest.join("\n\n").trim() };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

/**
 * Piece 3 — pending-claim banner. Renders in place of the search form
 * whenever GET /api/creators/claims comes back with a pending claim; the
 * parent recomputes `pending`/`owned` from fresh state after each refresh,
 * so once an admin approves/rejects it, the next "Check status" (or a
 * remount) naturally backs the section out of this branch on its own —
 * no local "am I still pending" bookkeeping needed here.
 */
function PendingBanner({ claim, onRefresh }: { claim: ClaimRow; onRefresh: () => Promise<void> }) {
  const [checking, setChecking] = useState(false);

  const submittedOn = formatDate(claim.created_at);
  const { evidenceUrl, extraNote } = splitEvidence(claim.note);

  async function checkStatus() {
    setChecking(true);
    try {
      await onRefresh();
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <p className="font-medium">Claim pending review</p>
      <p className="mt-1">
        You asked to claim <strong>{claim.creator.display_name}</strong> on {submittedOn}. We&rsquo;ll
        let you know once an admin reviews it.
      </p>
      {evidenceUrl && (
        <p className="mt-2 truncate text-xs text-amber-700">
          Evidence:{" "}
          <a href={evidenceUrl} target="_blank" rel="noreferrer" className="underline">
            {evidenceUrl}
          </a>
        </p>
      )}
      {extraNote && <p className="mt-1 whitespace-pre-wrap text-xs text-amber-700">{extraNote}</p>}
      <button
        type="button"
        onClick={checkStatus}
        disabled={checking}
        className="mt-3 rounded-full border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-800 transition hover:bg-amber-100 disabled:opacity-50"
      >
        {checking ? "Checking…" : "Check status"}
      </button>
    </div>
  );
}

/**
 * Piece 3b — rejected-claim acknowledgment. Renders in place of the search
 * form the first time the most recent claim comes back "rejected", so the
 * user gets an explicit signal instead of silently landing back on a blank
 * search box as if nothing had happened. "Try again" dismisses it locally
 * and returns to the search form — the claim itself isn't mutated, so a
 * fresh claim on the same or another creator works normally afterward.
 */
function RejectedBanner({ claim, onDismiss }: { claim: ClaimRow; onDismiss: () => void }) {
  const reviewedOn = formatDate(claim.reviewed_at ?? claim.created_at);
  const { evidenceUrl, extraNote } = splitEvidence(claim.note);

  return (
    <div className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
      <p className="font-medium text-neutral-800">Claim declined</p>
      <p className="mt-1">
        Your request to claim <strong>{claim.creator.display_name}</strong> was reviewed on{" "}
        {reviewedOn} and declined. If you have stronger evidence you can claim it again.
      </p>
      {evidenceUrl && (
        <p className="mt-2 truncate text-xs text-neutral-500">
          Evidence submitted:{" "}
          <a href={evidenceUrl} target="_blank" rel="noreferrer" className="underline">
            {evidenceUrl}
          </a>
        </p>
      )}
      {extraNote && <p className="mt-1 whitespace-pre-wrap text-xs text-neutral-500">{extraNote}</p>}
      <button
        type="button"
        onClick={onDismiss}
        className="mt-3 rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-100"
      >
        Try again
      </button>
    </div>
  );
}

/**
 * Piece 5 — owned-creator summary: a card with one big, unmissable call to
 * action. Editing is inline on the public page (hover a field → "Edit"), which
 * nobody discovers on their own, so the button is the front door to it.
 */
function OwnedSummary({ creator }: { creator: OwnedCreator }) {
  return (
    <div className="mt-3 rounded-xl border border-neutral-200 bg-white p-4">
      {creator.slug ? (
        <Link
          href={`/creators/${creator.slug}`}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-apb px-6 py-4 text-lg font-semibold text-white shadow-sm transition hover:opacity-90"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
          Edit my Creator Profile
        </Link>
      ) : null}
      <div className="flex items-center gap-3">
      {creator.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element -- external/re-hosted URLs, no next/image domains configured
        <img
          src={creator.image_url}
          alt={creator.display_name}
          className="h-12 w-12 shrink-0 rounded-full border border-neutral-200 object-cover"
        />
      ) : (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-apb/10 text-lg font-bold text-apb">
          {creator.display_name.slice(0, 1).toUpperCase()}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-neutral-800">{creator.display_name}</p>
        {creator.slug ? (
          <p className="text-xs text-neutral-500">
            Open your page, then hover any field and click <span className="font-medium text-apb">Edit</span>.
          </p>
        ) : null}
      </div>
      </div>
    </div>
  );
}
