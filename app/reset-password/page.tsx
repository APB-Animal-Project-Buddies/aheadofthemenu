"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getNhost } from "@/lib/nhost/client";
import { authErrorMessage } from "@/components/AuthProvider";
import { authStyles as s } from "@/components/auth/authStyles";

// Nhost enforces passwordMinLength = 9 (see nhost/nhost.toml).
const MIN_PASSWORD = 9;

/**
 * Set a new password. The reset email redirects here with a `refreshToken` that
 * establishes a short-lived session; we then call changeUserPassword. Also works
 * for an already-signed-in user who lands here directly.
 */
export default function ResetPasswordPage() {
  const [ready, setReady] = useState<"checking" | "ready" | "invalid">("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const refreshToken = new URLSearchParams(window.location.search).get("refreshToken");
    if (refreshToken) {
      getNhost()
        .auth.refreshToken({ refreshToken })
        .then(() => setReady("ready"))
        .catch(() => setReady("invalid"));
    } else if (getNhost().getUserSession()) {
      setReady("ready");
    } else {
      setReady("invalid");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setError(null);

    if (password.length < MIN_PASSWORD) {
      setError(`Password must be at least ${MIN_PASSWORD} characters`);
      setStatus("error");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      setStatus("error");
      return;
    }

    try {
      await getNhost().auth.changeUserPassword({ newPassword: password });
      setStatus("done");
    } catch (err) {
      setError(authErrorMessage(err));
      setStatus("error");
    }
  };

  const card = (inner: React.ReactNode) => (
    <div style={s.container}>
      <div style={s.formCard}>{inner}</div>
    </div>
  );

  if (ready === "checking") {
    return card(
      <div style={s.successBox}>
        <h2 style={s.successHeading}>One moment…</h2>
        <p style={s.successText}>Checking your reset link.</p>
      </div>
    );
  }

  if (ready === "invalid") {
    return card(
      <div style={s.successBox}>
        <div style={{ ...s.successIcon, color: "#c33" }}>!</div>
        <h2 style={s.successHeading}>Link expired or invalid</h2>
        <p style={s.successText}>Request a fresh password reset link to continue.</p>
        <p style={s.successText}>
          <Link href="/forgot-password" style={s.link}>Request a new link</Link>
        </p>
      </div>
    );
  }

  if (status === "done") {
    return card(
      <div style={s.successBox}>
        <div style={s.successIcon}>✓</div>
        <h2 style={s.successHeading}>Password updated</h2>
        <p style={s.successText}>You can now sign in with your new password.</p>
        <p style={s.successText}>
          <Link href="/login" style={s.link}>Go to sign in</Link>
        </p>
      </div>
    );
  }

  return card(
    <>
      <h1 style={s.title}>New password</h1>
      <p style={s.subtitle}>Choose a new password for your account.</p>

      <form onSubmit={handleSubmit} style={s.form}>
        <div style={s.field}>
          <label style={s.label}>New password <span style={s.required}>*</span></label>
          <div style={s.passwordInputContainer}>
            <input type={showPassword ? "text" : "password"} placeholder={`At least ${MIN_PASSWORD} characters`} value={password} onChange={(e) => setPassword(e.target.value)} required style={s.input} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} style={s.togglePasswordBtn}>
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <div style={s.field}>
          <label style={s.label}>Confirm password <span style={s.required}>*</span></label>
          <input type={showPassword ? "text" : "password"} placeholder="Re-enter your new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required style={s.input} />
        </div>

        {status === "error" && <div style={s.errorBox}>{error}</div>}

        <button type="submit" disabled={status === "submitting"} style={{ ...s.submitBtn, ...(status === "submitting" ? s.submitBtnDisabled : {}) }}>
          {status === "submitting" ? "Updating…" : "Update password"}
        </button>
      </form>
    </>
  );
}
