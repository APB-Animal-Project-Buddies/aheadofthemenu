"use client";

/**
 * Suggest-an-edit modal for an Eat This! dish, prefilled with the current values.
 * A regular signed-in user submits a PENDING suggestion; an admin (admin secret
 * stored) applies the change immediately. Same form, gated by who's asking.
 */
import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { useAuth } from "@/components/AuthProvider";
import { authFetch } from "@/lib/nhost/auth-fetch";
import { hasAdminSecret, adminHeaders } from "@/lib/admin-client";

export type EditableDish = {
  id: string;
  name: string;
  description: string | null;
  tags: string[];
  availability: "permanent" | "seasonal";
  customizations: string[];
};

export function SuggestEditModal({ dish, open, onClose, onApplied }: {
  dish: EditableDish;
  open: boolean;
  onClose: () => void;
  /** Called after an admin applies a change directly, so the page can refresh. */
  onApplied: () => void;
}) {
  const { isAuthenticated } = useAuth();
  const [admin, setAdmin] = useState(false);
  const [name, setName] = useState(dish.name);
  const [description, setDescription] = useState(dish.description ?? "");
  const [tags, setTags] = useState((dish.tags || []).join(", "));
  const [customizations, setCustomizations] = useState((dish.customizations || []).join(", "));
  const [availability, setAvailability] = useState<"permanent" | "seasonal">(dish.availability);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<null | "applied" | "suggested">(null);
  const [gate, setGate] = useState(false);

  useEffect(() => {
    if (!open) return;
    setAdmin(hasAdminSecret()); // client-only; avoids SSR hydration mismatch
    setName(dish.name);
    setDescription(dish.description ?? "");
    setTags((dish.tags || []).join(", "));
    setCustomizations((dish.customizations || []).join(", "));
    setAvailability(dish.availability);
    setNote("");
    setBusy(false);
    setError(null);
    setDone(null);
    setGate(false);
  }, [open, dish]);

  const submit = async () => {
    if (!admin && !isAuthenticated) { setGate(true); return; }
    setBusy(true);
    setError(null);
    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      customizations: customizations.split(",").map((t) => t.trim()).filter(Boolean),
      availability,
      note: note.trim() || undefined,
    };
    try {
      const url = `/api/eat-this/dishes/${dish.id}/edits`;
      const opts = { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) };
      const res = admin
        ? await fetch(url, { ...opts, headers: { ...opts.headers, ...adminHeaders() } })
        : await authFetch(url, opts);
      if (res.status === 401) { setGate(true); return; }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data?.error ?? "Couldn't submit that."); return; }
      if (data.applied) { setDone("applied"); onApplied(); } else setDone("suggested");
    } catch {
      setError("Couldn't submit that.");
    } finally {
      setBusy(false);
    }
  };

  const field = (label: string, value: string, set: (v: string) => void, placeholder?: string) => (
    <label className="text-xs font-semibold text-neutral-500">
      {label}
      <input
        value={value}
        onChange={(e) => set(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm font-normal text-neutral-800 focus:border-apb focus:outline-none"
      />
    </label>
  );

  return (
    <Modal open={open} onClose={onClose} title={admin ? "Edit dish (admin)" : "Suggest an edit"}>
      {done ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm text-neutral-700">
            {done === "applied" ? "Saved." : "Thanks — your suggestion is in for review."}
          </p>
          <button type="button" onClick={onClose} className="rounded-lg bg-apb px-4 py-2 text-sm font-semibold text-white">
            Close
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {field("Name", name, setName)}
          {field("Description", description, setDescription)}
          {field("Tags (comma-separated)", tags, setTags, "e.g. entree, spicy")}
          {field("Customizations (comma-separated)", customizations, setCustomizations, "e.g. tofu, seitan")}
          <div>
            <div className="text-xs font-semibold text-neutral-500">Availability</div>
            <div className="mt-1 flex gap-2">
              {(["permanent", "seasonal"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setAvailability(v)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition ${
                    availability === v ? "border-apb bg-apb text-white" : "border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-50"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          {!admin && field("Note (optional)", note, setNote, "Why this change?")}

          {gate && (
            <p className="text-xs text-neutral-600">
              <a className="font-semibold text-apb underline" href="/login?next=/eat-this">Sign in</a> to suggest an edit.
            </p>
          )}
          {error && <p className="text-xs text-red-600">{error}</p>}

          <button
            type="button"
            disabled={busy || !name.trim()}
            onClick={submit}
            className="self-start rounded-lg bg-apb px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? "Saving…" : admin ? "Apply changes" : "Submit suggestion"}
          </button>
        </div>
      )}
    </Modal>
  );
}
