"use client";

import { useState } from "react";
import Link from "next/link";
import { getNhost } from "@/lib/nhost/client";
import { authErrorMessage } from "@/components/AuthProvider";
import { authStyles as s } from "@/components/auth/authStyles";

/**
 * Request a password reset. Sends the Nhost reset email, whose link redirects to
 * /reset-password (see nhost.toml allowedUrls).
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setError(null);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      setStatus("error");
      return;
    }

    try {
      await getNhost().auth.sendPasswordResetEmail({
        email,
        options: { redirectTo: `${window.location.origin}/reset-password` },
      });
      setStatus("sent");
    } catch (err) {
      setError(authErrorMessage(err));
      setStatus("error");
    }
  };

  if (status === "sent") {
    return (
      <div style={s.container}>
        <div style={s.formCard}>
          <div style={s.successBox}>
            <div style={s.successIcon}>✉</div>
            <h2 style={s.successHeading}>Check your email</h2>
            <p style={s.successText}>
              If an account exists for <strong>{email}</strong>, we sent a link to reset your
              password.
            </p>
            <p style={s.successText}>
              <Link href="/login" style={s.link}>Back to sign in</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={s.container}>
      <div style={s.formCard}>
        <h1 style={s.title}>Reset password</h1>
        <p style={s.subtitle}>Enter your email and we&apos;ll send you a reset link.</p>

        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.field}>
            <label style={s.label}>Email <span style={s.required}>*</span></label>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={s.input}
            />
          </div>

          {status === "error" && <div style={s.errorBox}>{error}</div>}

          <button type="submit" disabled={status === "submitting"} style={{ ...s.submitBtn, ...(status === "submitting" ? s.submitBtnDisabled : {}) }}>
            {status === "submitting" ? "Sending…" : "Send reset link"}
          </button>
        </form>

        <p style={s.footerText}>
          Remembered it?{" "}
          <Link href="/login" style={s.link}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
