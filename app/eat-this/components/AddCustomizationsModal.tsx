"use client";

/**
 * Add customization options to a dish — open to any signed-in user (append-only,
 * applied directly). Comma-separated input; powers the rating breakdown.
 */
import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { useAuth } from "@/components/AuthProvider";
import { authFetch } from "@/lib/nhost/auth-fetch";

export function AddCustomizationsModal({ dishId, open, onClose, onAdded }: {
  dishId: string;
  open: boolean;
  onClose: () => void;
  /** Called after options are added, so the page can refetch. */
  onAdded: () => void;
}) {
  const { isAuthenticated } = useAuth();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gate, setGate] = useState(false);

  useEffect(() => {
    if (open) { setText(""); setBusy(false); setError(null); setGate(false); }
  }, [open]);

  const submit = async () => {
    const list = text.split(",").map((t) => t.trim()).filter(Boolean);
    if (!list.length) return;
    if (!isAuthenticated) { setGate(true); return; }
    setBusy(true);
    setError(null);
    try {
      const res = await authFetch(`/api/eat-this/dishes/${dishId}/customizations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customizations: list }),
      });
      if (res.status === 401) { setGate(true); return; }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data?.error ?? "Couldn't add those."); return; }
      onAdded();
      onClose();
    } catch {
      setError("Couldn't add those.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add customizations">
      <div className="flex flex-col gap-3">
        <p className="text-xs text-neutral-500">
          Options diners can pick when they rate — e.g. tofu, seitan, cabbage. Separate with commas.
        </p>
        <input
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submit(); } }}
          placeholder="tofu, seitan, cabbage"
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-apb focus:outline-none"
        />
        {gate && (
          <p className="text-xs text-neutral-600">
            <a className="font-semibold text-apb underline" href="/login?next=/eat-this">Sign in</a> to add customizations.
          </p>
        )}
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button
          type="button"
          onClick={submit}
          disabled={busy || !text.trim()}
          className="self-start rounded-lg bg-apb px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-40"
        >
          {busy ? "Adding…" : "Add"}
        </button>
      </div>
    </Modal>
  );
}
