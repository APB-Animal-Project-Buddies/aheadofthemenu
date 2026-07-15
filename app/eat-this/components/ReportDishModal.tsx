"use client";

/**
 * Report-a-problem modal for a reverse-lookup dish. Reason radios + an optional
 * note (required for "Something else"). Submits via authFetch; reports queue for
 * admin review — nothing hides automatically. Signed-in only.
 */
import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { authFetch } from "@/lib/nhost/auth-fetch";
import type { ReportReason } from "@/lib/reverse-lookup";

const REASONS: { value: ReportReason; label: string }[] = [
  { value: "not_on_menu", label: "No longer on the menu" },
  { value: "not_vegan", label: "Not actually vegan" },
  { value: "wrong_allergens", label: "Allergen info wrong or missing" },
  { value: "wrong_info", label: "Wrong details (name, description…)" },
  { value: "other", label: "Something else" },
];

export function ReportDishModal({ dishId, open, onClose }: {
  dishId: string;
  open: boolean;
  onClose: () => void;
}) {
  const [reason, setReason] = useState<ReportReason>("not_on_menu");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) return;
    setReason("not_on_menu");
    setNote("");
    setBusy(false);
    setError(null);
    setDone(false);
  }, [open]);

  const noteRequired = reason === "other";
  const canSubmit = !busy && (!noteRequired || note.trim() !== "");

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await authFetch(`/api/reverse-lookup/dishes/${dishId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, note: note.trim() || null }),
      });
      if (res.status === 401) { setError("Please sign in to report."); return; }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data?.error ?? "Couldn't submit your report."); return; }
      setDone(true);
    } catch {
      setError("Couldn't submit your report.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Report a problem">
      {done ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm text-neutral-700">Thanks — we&rsquo;ll take a look.</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-apb px-4 py-2 text-sm font-semibold text-white"
          >
            Close
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <fieldset className="flex flex-col gap-2">
            {REASONS.map((r) => (
              <label key={r.value} className="flex items-center gap-2 text-sm text-neutral-700">
                <input
                  type="radio"
                  name="rl-report-reason"
                  checked={reason === r.value}
                  onChange={() => setReason(r.value)}
                  className="accent-apb"
                />
                {r.label}
              </label>
            ))}
          </fieldset>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={noteRequired ? "Tell us what's wrong (required)" : "Add a note (optional)"}
            rows={3}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-apb focus:outline-none"
          />

          {error && <p className="text-xs text-red-600">{error}</p>}

          <button
            type="button"
            disabled={!canSubmit}
            onClick={submit}
            className="self-start rounded-lg bg-apb px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? "Submitting…" : "Submit report"}
          </button>
        </div>
      )}
    </Modal>
  );
}
