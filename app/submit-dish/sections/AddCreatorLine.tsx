"use client";

/**
 * "Can't find them? Add the creator" — inline mini-form under the Original
 * creator autocomplete. Existing creators are picked from the searchable
 * dropdown; this line adds a missing one (website + optional person name +
 * creator/brand name) and fills the field with it.
 */
import { useState } from "react";
import { Input } from "@/components/ui/input";

export function AddCreatorLine({
  onAdded,
}: {
  /** fillValue goes into the Original-creator field; newOptions join the dropdown. */
  onAdded: (fillValue: string, newOptions: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [website, setWebsite] = useState("");
  const [name, setName] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function add() {
    if (!name.trim() && !creatorName.trim()) {
      setMsg("Give at least a name or a creator name.");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/creators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ website, name, creatorName }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(j?.error ?? "Couldn't add the creator.");
        return;
      }
      onAdded(creatorName.trim() || name.trim(), [name.trim(), creatorName.trim()].filter(Boolean));
      setOpen(false);
      setWebsite("");
      setName("");
      setCreatorName("");
    } catch {
      setMsg("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-1.5 text-xs font-medium text-apb hover:underline"
      >
        Can&rsquo;t find them? + Add the creator
      </button>
    );
  }

  return (
    <div className="mt-2 space-y-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Input placeholder="rainbowplantlife.com" value={website} onChange={(e) => setWebsite(e.target.value)} aria-label="Website" />
        <Input placeholder="Nisha Vora (optional)" value={name} onChange={(e) => setName(e.target.value)} aria-label="Name (optional)" />
        <Input placeholder="Rainbow Plant Life" value={creatorName} onChange={(e) => setCreatorName(e.target.value)} aria-label="Creator name" />
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={add}
          disabled={busy}
          className="rounded-full bg-apb px-4 py-1.5 text-xs font-medium text-white transition hover:bg-apb-light disabled:opacity-50"
        >
          {busy ? "Adding…" : "Add creator"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-neutral-500 hover:underline">
          Cancel
        </button>
        {msg && <span className="text-xs text-red-600">{msg}</span>}
      </div>
    </div>
  );
}
