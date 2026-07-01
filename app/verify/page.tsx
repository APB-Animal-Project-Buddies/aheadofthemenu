"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getNhost } from "@/lib/nhost/client";
import { authStyles as s } from "@/components/auth/authStyles";

/**
 * Landing target for the email-verification link (see nhost.toml redirections).
 * Nhost verifies the ticket server-side and redirects here with a `refreshToken`
 * in the URL; we exchange it for a session (logging the user in) and go home.
 */
export default function VerifyPage() {
  const router = useRouter();
  const [state, setState] = useState<"working" | "done" | "error">("working");

  useEffect(() => {
    const refreshToken = new URLSearchParams(window.location.search).get("refreshToken");
    if (!refreshToken) {
      setState("error");
      return;
    }
    getNhost()
      .auth.refreshToken({ refreshToken })
      .then(() => {
        setState("done");
        setTimeout(() => router.replace("/"), 1500);
      })
      .catch(() => setState("error"));
  }, [router]);

  return (
    <div style={s.container}>
      <div style={s.formCard}>
        {state === "working" && (
          <div style={s.successBox}>
            <h2 style={s.successHeading}>Verifying…</h2>
            <p style={s.successText}>Confirming your email — one moment.</p>
          </div>
        )}
        {state === "done" && (
          <div style={s.successBox}>
            <div style={s.successIcon}>✓</div>
            <h2 style={s.successHeading}>Email verified!</h2>
            <p style={s.successText}>You&apos;re all set — taking you to Ahead of the Menu…</p>
          </div>
        )}
        {state === "error" && (
          <div style={s.successBox}>
            <div style={{ ...s.successIcon, color: "#c33" }}>!</div>
            <h2 style={s.successHeading}>Link expired or invalid</h2>
            <p style={s.successText}>
              This verification link didn&apos;t work. Sign in and we can send a fresh one.
            </p>
            <p style={s.successText}>
              <Link href="/login" style={s.link}>Go to sign in</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
