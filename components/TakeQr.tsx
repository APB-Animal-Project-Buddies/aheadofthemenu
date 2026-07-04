"use client";

/**
 * Inline claim widget for /q/<code>?take — lets a signed-in visitor claim an
 * unclaimed potluck QR right where they scanned it, instead of pasting the
 * code into their active-dishes page. On success we follow the QR to its new
 * destination so the claimer immediately sees what future scanners will see.
 */
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";

type TargetType = "active_dishes" | "dish_instance";

export function TakeQr({ code }: { code: string }) {
  const { session } = useAuth();
  const accessToken = session?.accessToken ?? null;

  const [targetType, setTargetType] = useState<TargetType>("active_dishes");
  const [instanceCode, setInstanceCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!accessToken) {
    return (
      <div className="mt-6">
        <p className="text-sm text-neutral-600">Sign in to claim it, then scan or reopen this link.</p>
        <Link
          href="/login"
          className="mt-3 inline-block rounded-full bg-apb px-5 py-2.5 text-sm font-medium text-white transition hover:bg-apb-light"
        >
          Sign in
        </Link>
      </div>
    );
  }

  async function claim(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/qr/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ code, targetType, instanceCode }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Couldn't claim this QR.");
        setBusy(false);
        return;
      }
      // Follow the QR to its new destination.
      window.location.assign(data?.url ?? `/q/${code}`);
    } catch {
      setError("Network error — please try again.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={claim} className="mx-auto mt-6 max-w-sm space-y-4 text-left">
      <fieldset className="space-y-2">
        <legend className="text-xs font-medium text-neutral-500">Point it at</legend>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="take-target"
            checked={targetType === "active_dishes"}
            onChange={() => setTargetType("active_dishes")}
          />
          My active dishes page
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="take-target"
            checked={targetType === "dish_instance"}
            onChange={() => setTargetType("dish_instance")}
          />
          A specific dish instance
        </label>
      </fieldset>

      {targetType === "dish_instance" && (
        <div>
          <label className="block text-xs font-medium text-neutral-500">Dish-instance link or code</label>
          <input
            value={instanceCode}
            onChange={(e) => setInstanceCode(e.target.value)}
            placeholder="/dishes/15?instance=abc123  or  abc123"
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-apb focus:outline-none"
            required
          />
        </div>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-full bg-apb px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-apb-light disabled:opacity-50"
      >
        {busy ? "Claiming…" : "Claim this QR"}
      </button>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
