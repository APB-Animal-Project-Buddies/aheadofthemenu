"use client";

/**
 * Piece 2 — "This is me" claim-request modal, split out of
 * ClaimCreatorSection.tsx so it can be reused/tested on its own.
 *
 * There's no automated ownership check for a claim, so the bar is an
 * evidence-gated submission: a link (channel/profile/website/press mention)
 * is required, not optional, and validated to look like a URL before the
 * submit button will even fire. The free-text note is additional context
 * layered on top of that link, not a substitute for it. The API
 * (POST /api/creators/claims) re-validates the same way — this client check
 * is a UX nicety, not the actual gate.
 */
import { useState } from "react";
import { authFetch } from "@/lib/nhost/auth-fetch";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

const URL_RE = /^https?:\/\/.+/i;

export function ClaimCreatorModal({
  creator,
  onClose,
  onSubmitted,
}: {
  creator: { id: string; name: string };
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const trimmedUrl = evidenceUrl.trim();
  const urlLooksValid = URL_RE.test(trimmedUrl);

  async function submit() {
    if (!urlLooksValid) {
      setMsg("We need a link to confirm this is you — paste your Instagram, YouTube, TikTok, or website URL.");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      // The evidence link is the required signal the API gates on; the note
      // is optional extra context, so it rides along appended after it.
      const trimmedNote = note.trim();
      const body = trimmedNote ? `${trimmedUrl}\n\n${trimmedNote}` : trimmedUrl;
      const res = await authFetch("/api/creators/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creatorId: creator.id, note: body }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        // Covers 409 (already claimed) the same way as any other error —
        // the API's message is specific enough to show inline as-is.
        setMsg(data?.error || "Couldn't submit your claim.");
        return;
      }
      onSubmitted();
    } catch {
      setMsg("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={`Claim ${creator.name}`}>
      <p className="text-sm text-neutral-600">
        There&rsquo;s no automated check here, so link your Instagram, YouTube, TikTok, or website
        so we can confirm you run this profile.
      </p>
      <div className="mt-3">
        <label className="text-xs font-medium text-neutral-700">Evidence link (required)</label>
        <Input
          className="mt-1"
          placeholder="https://instagram.com/yourhandle"
          value={evidenceUrl}
          onChange={(e) => setEvidenceUrl(e.target.value)}
          disabled={busy}
        />
        <p className="mt-1 text-xs text-neutral-400">
          We need a link to confirm this is you — a channel, social profile, website, or press
          mention that shows you&rsquo;re {creator.name}.
        </p>
      </div>
      <div className="mt-3">
        <label className="text-xs font-medium text-neutral-700">Note (optional)</label>
        <textarea
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-apb focus:outline-none"
          rows={2}
          placeholder="Anything else that helps us verify it's you"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={busy}
        />
      </div>
      {msg && <p className="mt-2 text-xs text-red-600">{msg}</p>}
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={busy || !trimmedUrl}
          className="flex-1 rounded-full bg-apb px-4 py-2 text-xs font-medium text-white transition hover:bg-apb-light disabled:opacity-50"
        >
          {busy ? "Submitting…" : "Submit claim"}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="rounded-full border border-neutral-300 px-4 py-2 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50"
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
}
