"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "@/components/AuthProvider";
import { Avatar } from "@/components/Avatar";
import { ROLE_OPTIONS, USER_TYPE_LABELS } from "@/lib/nhost/roles";
import { normalizeHandle, validateHandle } from "@/lib/handle";
import { getNhost } from "@/lib/nhost/client";

function roleLabel(role: string | null): string {
  if (!role) return "—";
  return ROLE_OPTIONS.find((o) => o.role === role)?.label ?? role;
}

export default function ProfilePage() {
  const router = useRouter();
  const {
    isLoading, isAuthenticated, userId, email, displayName, avatarUrl,
    handle, role, userType, zipCode, emailVerified, resendVerification, signOut,
  } = useAuth();
  const [resend, setResend] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const activeDishesUrl = handle && origin ? `${origin}/${handle}/active-dishes` : "";

  // --- handle editor ---
  const [editingHandle, setEditingHandle] = useState(false);
  const [handleInput, setHandleInput] = useState("");
  const [handleMsg, setHandleMsg] = useState<{ state: "idle" | "checking" | "ok" | "bad"; msg: string }>({ state: "idle", msg: "" });
  const [savingHandle, setSavingHandle] = useState(false);

  // Live availability check while editing the handle.
  useEffect(() => {
    if (!editingHandle) return;
    const h = handleInput;
    if (!h) return setHandleMsg({ state: "idle", msg: "" });
    if (normalizeHandle(h) === handle) return setHandleMsg({ state: "idle", msg: "Current handle" });
    const err = validateHandle(h);
    if (err) return setHandleMsg({ state: "bad", msg: err });
    setHandleMsg({ state: "checking", msg: "Checking…" });
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/handles?handle=${encodeURIComponent(normalizeHandle(h))}`);
        const data = await res.json();
        setHandleMsg(data.available ? { state: "ok", msg: "Available" } : { state: "bad", msg: data.error || "Taken" });
      } catch {
        setHandleMsg({ state: "idle", msg: "" });
      }
    }, 450);
    return () => clearTimeout(t);
  }, [handleInput, editingHandle, handle]);

  const saveHandle = async () => {
    const err = validateHandle(handleInput);
    if (err || handleMsg.state === "bad") return;
    setSavingHandle(true);
    try {
      const res = await fetch("/api/handles", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(userId ? { "X-User-Id": userId } : {}) },
        body: JSON.stringify({ handle: normalizeHandle(handleInput) }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setHandleMsg({ state: "bad", msg: j.error || "Couldn't save" });
        return;
      }
      await getNhost().refreshSession(0); // pull updated metadata into the session
      setEditingHandle(false);
    } finally {
      setSavingHandle(false);
    }
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return <div className="flex min-h-[50vh] items-center justify-center text-neutral-500">Loading…</div>;
  }

  const handleResend = async () => {
    if (!email) return;
    setResend("sending");
    try {
      await resendVerification(email);
      setResend("sent");
    } catch {
      setResend("error");
    }
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      {activeDishesUrl && (
        <div className="mb-6 flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex-none rounded-lg bg-white p-1">
            <QRCodeSVG value={activeDishesUrl} size={92} marginSize={1} />
          </div>
          <div className="min-w-0">
            <div className="font-medium text-neutral-900">Your active dishes</div>
            <a href={`/${handle}/active-dishes`} className="break-all text-sm text-apb hover:underline">
              {activeDishesUrl}
            </a>
            <p className="mt-1 text-xs text-neutral-500">
              Share this QR — it opens the dishes you currently have open for review.
            </p>
          </div>
        </div>
      )}
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-neutral-100 bg-apb-cream px-6 py-6">
          <Avatar email={email} displayName={displayName} avatarUrl={avatarUrl} size={64} />
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold text-neutral-900">{displayName || email}</h1>
            <p className="truncate text-sm text-neutral-500">{email}</p>
          </div>
        </div>

        {/* Details */}
        <dl className="divide-y divide-neutral-100">
          <div className="flex items-start justify-between gap-4 px-6 py-4">
            <dt className="pt-1 text-sm font-medium text-neutral-500">Handle</dt>
            <dd className="text-right text-neutral-800">
              {!editingHandle ? (
                <div className="flex items-center gap-3">
                  <span>{handle ? `@${handle}` : <span className="text-neutral-400">Not set</span>}</span>
                  <button
                    type="button"
                    onClick={() => { setEditingHandle(true); setHandleInput(handle ?? ""); setHandleMsg({ state: "idle", msg: "" }); }}
                    className="text-sm font-medium text-apb hover:underline"
                  >
                    Edit
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-end gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-400">@</span>
                    <input
                      value={handleInput}
                      onChange={(e) => setHandleInput(e.target.value)}
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      placeholder="handle"
                      className="w-40 rounded-md border border-neutral-300 px-2 py-1 text-sm"
                    />
                    <button
                      type="button"
                      disabled={savingHandle || handleMsg.state === "bad" || handleMsg.state === "checking"}
                      onClick={saveHandle}
                      className="rounded-md bg-apb px-3 py-1 text-sm font-medium text-white disabled:opacity-50"
                    >
                      {savingHandle ? "Saving…" : "Save"}
                    </button>
                    <button type="button" onClick={() => setEditingHandle(false)} className="text-sm text-neutral-500 hover:underline">
                      Cancel
                    </button>
                  </div>
                  {handleMsg.state !== "idle" && (
                    <span className={`text-xs ${handleMsg.state === "ok" ? "text-emerald-600" : handleMsg.state === "bad" ? "text-red-600" : "text-neutral-400"}`}>
                      {handleMsg.state === "ok" ? "✓ " : ""}
                      {handleMsg.msg}
                    </span>
                  )}
                </div>
              )}
            </dd>
          </div>
          <Row label="Account type">
            <span className="capitalize">{userType ? USER_TYPE_LABELS[userType] : "—"}</span>
          </Row>
          <Row label="Role">{roleLabel(role)}</Row>
          <Row label="Zip code">{zipCode || "—"}</Row>
          <Row label="Email status">
            {emailVerified ? (
              <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600">
                <span aria-hidden>✓</span> Verified
              </span>
            ) : (
              <span className="flex flex-wrap items-center gap-3">
                <span className="font-medium text-amber-600">Not verified</span>
                {resend === "sent" ? (
                  <span className="text-sm text-emerald-600">Verification email sent</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resend === "sending"}
                    className="rounded-full border border-neutral-200 px-3 py-1 text-sm font-medium text-neutral-700 transition hover:border-apb-accent hover:text-apb disabled:opacity-60"
                  >
                    {resend === "sending" ? "Sending…" : resend === "error" ? "Try again" : "Resend link"}
                  </button>
                )}
              </span>
            )}
          </Row>
        </dl>

        {/* Actions */}
        <div className="flex justify-end border-t border-neutral-100 px-6 py-4">
          <button
            type="button"
            onClick={() => signOut().then(() => router.replace("/"))}
            className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:border-red-300 hover:text-red-600"
          >
            Sign out
          </button>
        </div>
      </div>
    </main>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-6 py-4">
      <dt className="text-sm font-medium text-neutral-500">{label}</dt>
      <dd className="text-right text-neutral-800">{children}</dd>
    </div>
  );
}
