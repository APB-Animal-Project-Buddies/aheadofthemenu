"use client";

/**
 * "Claim a URL" — owner-only panel on the active-dishes page. Paste the code
 * (or link) from an open potluck QR, choose where it should point (your active
 * dishes, or one specific dish instance), and bind it to your account. Claimed
 * codes are listed with their current destination and can be re-pointed.
 */
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { QrScanButton } from "@/components/QrScanButton";

type TargetType = "active_dishes" | "dish_instance";
type QrRow = { code: string; target_type: TargetType | null; target_id: string | null; label: string | null };
type ScanStatus = "open" | "mine" | "taken" | "unknown";
type ScanInfo = { status: ScanStatus; code: string; target_type?: TargetType | null; target_id?: string | null };

/** Extract the bare code from a scanned/pasted value (raw code or ".../q/<code>"). */
function codeFromText(raw: string): string {
  const s = String(raw ?? "").trim();
  const m = s.match(/\/q\/([^/?#\s]+)/i);
  if (m) return m[1];
  return s.replace(/^https?:\/\/[^/]+/i, "").replace(/[?#].*$/, "").replace(/^\/+/, "");
}

export function ClaimQrSection() {
  const { session } = useAuth();
  const accessToken = session?.accessToken ?? null;

  const [code, setCode] = useState("");
  const [targetType, setTargetType] = useState<TargetType>("active_dishes");
  const [instanceCode, setInstanceCode] = useState("");
  const [status, setStatus] = useState<"idle" | "saving">("idle");
  const [error, setError] = useState<string | null>(null);
  const [okUrl, setOkUrl] = useState<string | null>(null);
  const [claimed, setClaimed] = useState<QrRow[]>([]);
  const [scan, setScan] = useState<ScanInfo | null>(null);

  const loadClaimed = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await fetch("/api/qr/claim", { headers: { Authorization: `Bearer ${accessToken}` } });
      if (res.ok) setClaimed((await res.json()).qrs ?? []);
    } catch {
      /* non-critical */
    }
  }, [accessToken]);

  useEffect(() => {
    loadClaimed();
  }, [loadClaimed]);

  // Scanned (or pasted) a code -> prefill it and look up what should happen next.
  const handleScanned = useCallback(
    async (text: string) => {
      const c = codeFromText(text);
      setCode(c);
      setError(null);
      setOkUrl(null);
      setScan(null);
      if (!c || !accessToken) return;
      try {
        const res = await fetch(`/api/qr/claim?code=${encodeURIComponent(c)}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data?.status) {
          setScan({ status: data.status, code: data.code ?? c, target_type: data.target_type, target_id: data.target_id });
          if (data.status === "mine" && data.target_type === "dish_instance") {
            setTargetType("dish_instance");
            setInstanceCode(data.target_id ?? "");
          }
        }
      } catch {
        /* non-critical — they can still claim manually */
      }
    },
    [accessToken]
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken) return;
    setStatus("saving");
    setError(null);
    setOkUrl(null);
    try {
      const res = await fetch("/api/qr/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ code, targetType, instanceCode }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Couldn't claim that code.");
      } else {
        setOkUrl(data?.url ?? null);
        setCode("");
        setInstanceCode("");
        setScan(null);
        loadClaimed();
      }
    } catch {
      setError("Network error — please try again.");
    } finally {
      setStatus("idle");
    }
  }

  const targetLabel = (r: QrRow) =>
    r.target_type === "dish_instance" ? `dish instance ${r.target_id ?? ""}`.trim() : "your active dishes";

  return (
    <section className="mt-10 rounded-2xl border border-apb/20 bg-apb/[0.03] p-5">
      <h2 className="font-serif text-lg font-semibold text-apb">Claim a URL</h2>
      <p className="mt-1 text-sm text-neutral-600">
        Got an “open” potluck QR? Paste its code or link below to point it at your dishes.
      </p>

      <form onSubmit={submit} className="mt-4 space-y-4">
        <div>
          <label className="block text-xs font-medium text-neutral-500">QR code or link</label>
          <div className="mt-1 flex items-start gap-2">
            <input
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setScan(null);
              }}
              placeholder="pot-h4k2  or  https://…/q/pot-h4k2"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-apb focus:outline-none"
              required
            />
            <QrScanButton onResult={handleScanned} />
          </div>

          {scan && (
            <div className="mt-2 text-sm">
              {scan.status === "open" && (
                <p className="rounded-lg bg-apb/5 px-3 py-2 text-apb">
                  ✓ <span className="font-mono font-medium">{scan.code}</span> is open — pick where it points below, then claim it. 👇
                </p>
              )}
              {scan.status === "mine" && (
                <p className="rounded-lg bg-apb/5 px-3 py-2 text-apb">
                  You already own <span className="font-mono font-medium">{scan.code}</span>.{" "}
                  <a href={`/q/${scan.code}`} className="font-medium underline">
                    Open it →
                  </a>{" "}
                  or re-point it below.
                </p>
              )}
              {scan.status === "taken" && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-red-700">
                  <span className="font-mono font-medium">{scan.code}</span> is already claimed by someone else.
                </p>
              )}
              {scan.status === "unknown" && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-red-700">
                  That doesn’t look like a potluck QR code.
                </p>
              )}
            </div>
          )}
        </div>

        <fieldset className="space-y-2">
          <legend className="text-xs font-medium text-neutral-500">Point it at</legend>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="target"
              checked={targetType === "active_dishes"}
              onChange={() => setTargetType("active_dishes")}
            />
            My active dishes page
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="target"
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
          disabled={status === "saving" || !accessToken}
          className="rounded-full bg-apb px-5 py-2 text-sm font-medium text-white transition hover:bg-apb-light disabled:opacity-50"
        >
          {status === "saving" ? "Claiming…" : "Claim this QR"}
        </button>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {okUrl && (
          <p className="text-sm text-apb">
            Claimed! It now points to{" "}
            <a href={okUrl} className="font-medium underline">
              {okUrl}
            </a>
            .
          </p>
        )}
      </form>

      {claimed.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xs font-medium uppercase tracking-wide text-neutral-500">Your claimed QRs</h3>
          <ul className="mt-2 space-y-1.5">
            {claimed.map((r) => (
              <li key={r.code} className="flex items-center justify-between gap-3 text-sm">
                <a href={`/q/${r.code}`} className="font-mono font-medium text-apb hover:underline">
                  {r.code}
                </a>
                <span className="truncate text-neutral-500">→ {targetLabel(r)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
