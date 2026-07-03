"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth, authErrorMessage, isUnverifiedError } from "@/components/AuthProvider";
import { authStyles as s } from "./authStyles";

/**
 * Sign-in card. Rendered both as a full page (/login) and inside the modal
 * (intercepted route). On success it hard-navigates to / — reliably dismissing
 * the modal and reloading with the fresh session.
 */
export function LoginForm() {
  const { signIn, resendVerification } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [unverified, setUnverified] = useState(false);
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setError(null);
    setUnverified(false);
    setResendStatus("idle");

    if (!formData.email || !formData.password) {
      setError("Email and password are required");
      setStatus("error");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Please enter a valid email address");
      setStatus("error");
      return;
    }

    try {
      await signIn(formData.email, formData.password);
      setStatus("success");
      // Hard-navigate: reliably leaves the intercepting-route modal AND reloads
      // with the fresh session (router.push from inside the modal was stalling).
      setTimeout(() => window.location.assign("/"), 600);
    } catch (err) {
      if (isUnverifiedError(err)) {
        setUnverified(true);
        setError("Your email isn't verified yet. Check your inbox for the verification link.");
      } else {
        setError(authErrorMessage(err));
      }
      setStatus("error");
    }
  };

  const handleResend = async () => {
    setResendStatus("sending");
    try {
      await resendVerification(formData.email);
      setResendStatus("sent");
    } catch {
      setResendStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div style={s.formCard}>
        <div style={s.successBox}>
          <div style={s.successIcon}>✓</div>
          <h2 style={s.successHeading}>Logged in!</h2>
          <p style={s.successText}>Taking you to Ahead of the Menu…</p>
        </div>
      </div>
    );
  }

  return (
    <div style={s.formCard}>
      <h1 style={s.title}>Log in</h1>
      <p style={s.subtitle}>Welcome back to Ahead of the Menu</p>

      <form onSubmit={handleSubmit} style={s.form}>
        <div style={s.field}>
          <label style={s.label}>Email <span style={s.required}>*</span></label>
          <input type="email" name="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} required style={s.input} />
        </div>

        <div style={s.field}>
          <label style={s.label}>Password <span style={s.required}>*</span></label>
          <div style={s.passwordInputContainer}>
            <input type={showPassword ? "text" : "password"} name="password" placeholder="Enter your password" value={formData.password} onChange={handleChange} required style={s.input} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} style={s.togglePasswordBtn}>
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <div style={s.forgotRow}>
          <Link href="/forgot-password" style={s.link}>Forgot password?</Link>
        </div>

        {status === "error" && (
          <div style={s.errorBox}>
            <span>{error}</span>
            {unverified && (
              <div style={s.resendRow}>
                {resendStatus === "sent" ? (
                  <span style={s.resendSent}>✓ Verification email sent to {formData.email}</span>
                ) : (
                  <button type="button" onClick={handleResend} disabled={resendStatus === "sending"} style={s.resendBtn}>
                    {resendStatus === "sending" ? "Sending…" : resendStatus === "error" ? "Couldn't send — try again" : "Resend verification email"}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        <button type="submit" disabled={status === "submitting"} style={{ ...s.submitBtn, ...(status === "submitting" ? s.submitBtnDisabled : {}) }}>
          {status === "submitting" ? "Logging in…" : "Log in"}
        </button>
      </form>

      <p style={s.footerText}>
        Don&apos;t have an account?{" "}
        <Link href="/register" style={s.link}>Create one</Link>
      </p>
    </div>
  );
}
