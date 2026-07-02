"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Avatar } from "@/components/Avatar";
import { ROLE_OPTIONS, USER_TYPE_LABELS } from "@/lib/nhost/roles";

function roleLabel(role: string | null): string {
  if (!role) return "—";
  return ROLE_OPTIONS.find((o) => o.role === role)?.label ?? role;
}

export default function ProfilePage() {
  const router = useRouter();
  const {
    isLoading, isAuthenticated, email, displayName, avatarUrl,
    role, userType, zipCode, emailVerified, resendVerification, signOut,
  } = useAuth();
  const [resend, setResend] = useState<"idle" | "sending" | "sent" | "error">("idle");

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
