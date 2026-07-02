"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getNhost, nhostAuthUrl } from "@/lib/nhost/client";
import { authStyles as s } from "@/components/auth/authStyles";

/**
 * Landing target for the email-verification link (see nhost.toml redirections).
 * Nhost verifies the ticket server-side and redirects here with a `refreshToken`
 * in the URL; we exchange it for a session (logging the user in) and go home.
 */
export default function VerifyPage() {
  const [state, setState] = useState<"working" | "done" | "error">("working");

  useEffect(() => {
    const refreshToken = new URLSearchParams(window.location.search).get("refreshToken");
    if (!refreshToken) {
      setState("error");
      return;
    }
    let cancelled = false;
    (async () => {
      // The email is already verified server-side by the time Nhost redirects
      // here. Try to establish a session from the refreshToken via a direct
      // fetch (the SDK method stalls here) — with an abort timeout so it can
      // never hang — then hard-navigate. Fall back to /login if it doesn't take.
      let dest = "/login";
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 4000);
        const res = await fetch(`${nhostAuthUrl()}/token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
          signal: ctrl.signal,
        });
        clearTimeout(timer);
        if (res.ok) {
          const session = await res.json();
          try {
            getNhost().sessionStorage.set(session);
            dest = "/"; // logged in — go home
          } catch {
            dest = "/login";
          }
        }
      } catch {
        /* timed out or blocked — email is still verified, just send to login */
      }
      if (cancelled) return;
      setState("done");
      setTimeout(() => window.location.assign(dest), 1200);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
