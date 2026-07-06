"use client";

/**
 * "Can't find them? Add the creator" — modal form to add a missing creator.
 * Existing creators are picked from the searchable dropdown; this modal adds
 * a missing one (website + creator name + optional real name) and refetches
 * the full list to update shared state.
 */
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useCreatorsStore } from "@/app/stores/creators";

export function AddCreatorLine({
  onAdded,
  existingCreators = [],
}: {
  /** fillValue goes into the Original-creator field; newOptions join the dropdown. */
  onAdded: (fillValue: string, newOptions: string[]) => void;
  existingCreators?: string[];
}) {
  const [open, setOpen] = useState(false);
  const [website, setWebsite] = useState("");
  const [name, setName] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function add() {
    if (!website.trim()) {
      setMsg("Website is required.");
      return;
    }
    if (!name.trim() && !creatorName.trim()) {
      setMsg("Give at least a creator name or real name.");
      return;
    }

    // Check for collision with existing creators (case-insensitive)
    const creatorNameLower = creatorName.trim().toLowerCase();
    const nameLower = name.trim().toLowerCase();
    const isDuplicate = existingCreators.some(
      (c) => c.toLowerCase() === creatorNameLower || c.toLowerCase() === nameLower
    );
    if (isDuplicate) {
      setMsg("That creator already exists in the list.");
      return;
    }

    setBusy(true);
    setMsg(null);

    // Only the POST decides success/failure. The canonical-list refresh below
    // is best-effort polish — bundling it into this try/catch used to report
    // "network error" (and skip onAdded) after the insert had already
    // committed, leaving the dropdown stale for the whole session.
    try {
      const res = await fetch("/api/creators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ website, name, creatorName }),
      });
      const j = await res.json().catch(() => ({}));
      // 409 = the creator already exists (older deploys) — the goal state is
      // reached either way, so treat it as success too.
      if (!res.ok && res.status !== 409) {
        setMsg(j?.error ?? "Couldn't add the creator.");
        return;
      }
    } catch {
      setMsg("Network error — please try again.");
      return;
    } finally {
      setBusy(false);
    }

    onAdded(creatorName.trim() || name.trim(), [name.trim(), creatorName.trim()].filter(Boolean));
    setOpen(false);
    setWebsite("");
    setName("");
    setCreatorName("");

    // Background refresh so the dropdown picks up the canonical server list.
    void useCreatorsStore.getState().refetch();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-1.5 text-xs font-medium text-apb hover:underline"
      >
        Can&rsquo;t find them? + Add the creator
      </button>

      <Modal open={open} onClose={() => { setOpen(false); setMsg(null); }} title="Add a new creator">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-neutral-700">Website (required)</label>
            <Input
              className="mt-1"
              placeholder="rainbowplantlife.com"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              disabled={busy}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-700">Creator name (required)</label>
            <Input
              className="mt-1"
              placeholder="e.g. Rainbow Plant Life"
              value={creatorName}
              onChange={(e) => setCreatorName(e.target.value)}
              disabled={busy}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-700">Real name (optional)</label>
            <Input
              className="mt-1"
              placeholder="e.g. Nisha Vora"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={busy}
            />
          </div>
          {msg && <p className="text-xs text-red-600">{msg}</p>}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={add}
              disabled={busy}
              className="flex-1 rounded-full bg-apb px-4 py-2 text-xs font-medium text-white transition hover:bg-apb-light disabled:opacity-50"
            >
              {busy ? "Adding…" : "Add creator"}
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); setMsg(null); }}
              disabled={busy}
              className="rounded-full border border-neutral-300 px-4 py-2 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
