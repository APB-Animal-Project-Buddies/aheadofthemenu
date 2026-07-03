"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth, authErrorMessage } from "@/components/AuthProvider";
import { ROLE_OPTIONS, USER_TYPE_LABELS, type Role, type UserType } from "@/lib/nhost/roles";
import { normalizeHandle, validateHandle } from "@/lib/handle";
import { authStyles as s } from "./authStyles";

interface RegistrationData {
  email: string;
  password: string;
  confirmPassword: string;
  handle: string;
  zipCode: string;
  role: Role;
}

type HandleState = { state: "idle" | "checking" | "ok" | "bad"; msg: string };

// Roles grouped by user type, preserving ROLE_OPTIONS order, for the picker.
const ROLE_GROUPS = (Object.keys(USER_TYPE_LABELS) as UserType[]).map((userType) => ({
  userType,
  label: USER_TYPE_LABELS[userType],
  options: ROLE_OPTIONS.filter((o) => o.userType === userType),
}));

// Nhost enforces passwordMinLength = 9 (see nhost/nhost.toml).
const MIN_PASSWORD = 9;

export function RegisterForm() {
  const { signUp } = useAuth();
  const [formData, setFormData] = useState<RegistrationData>({
    email: "",
    password: "",
    confirmPassword: "",
    handle: "",
    zipCode: "",
    role: "homecook",
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [handleState, setHandleState] = useState<HandleState>({ state: "idle", msg: "" });

  // Live handle check: format first (client), then debounced availability (server).
  useEffect(() => {
    const h = formData.handle;
    if (!h) return setHandleState({ state: "idle", msg: "" });
    const err = validateHandle(h);
    if (err) return setHandleState({ state: "bad", msg: err });
    setHandleState({ state: "checking", msg: "Checking availability…" });
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/handles?handle=${encodeURIComponent(normalizeHandle(h))}`);
        const data = await res.json();
        setHandleState(
          data.available
            ? { state: "ok", msg: "Available" }
            : { state: "bad", msg: data.error || "That handle is taken" }
        );
      } catch {
        setHandleState({ state: "idle", msg: "" });
      }
    }, 450);
    return () => clearTimeout(t);
  }, [formData.handle]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setError(null);

    if (!formData.email || !formData.password) {
      setError("Email and password are required");
      setStatus("error");
      return;
    }
    if (formData.password.length < MIN_PASSWORD) {
      setError(`Password must be at least ${MIN_PASSWORD} characters`);
      setStatus("error");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setStatus("error");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Please enter a valid email address");
      setStatus("error");
      return;
    }
    const handleErr = validateHandle(formData.handle);
    if (handleErr) {
      setError(handleErr);
      setStatus("error");
      return;
    }
    if (handleState.state === "bad") {
      setError(handleState.msg);
      setStatus("error");
      return;
    }

    try {
      const { needsVerification } = await signUp({
        email: formData.email,
        password: formData.password,
        role: formData.role,
        handle: normalizeHandle(formData.handle),
        zipCode: formData.zipCode || undefined,
      });
      setStatus("success");
      if (!needsVerification) {
        setTimeout(() => {
          window.location.href = "/";
        }, 1500);
      }
    } catch (err) {
      setError(authErrorMessage(err));
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div style={s.formCard}>
        <div style={s.successBox}>
          <div style={s.successIcon}>✉</div>
          <h2 style={s.successHeading}>Check your email</h2>
          <p style={s.successText}>
            We sent a verification link to <strong>{formData.email}</strong>. Click it to activate
            your account, then sign in.
          </p>
          <p style={s.successText}>
            <Link href="/login" style={s.link}>Go to sign in</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={s.formCard}>
      <h1 style={s.title}>Create account</h1>
      <p style={s.subtitle}>Join Ahead of the Menu</p>

      <form onSubmit={handleSubmit} style={s.form}>
        <div style={s.field}>
          <label style={s.label}>Email <span style={s.required}>*</span></label>
          <input type="email" name="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} required style={s.input} />
        </div>

        <div style={s.field}>
          <label style={s.label}>Handle <span style={s.required}>*</span></label>
          <input
            type="text"
            name="handle"
            placeholder="e.g. chef_nora"
            value={formData.handle}
            onChange={handleChange}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
            style={s.input}
          />
          {handleState.state !== "idle" && (
            <span
              style={{
                fontSize: 12,
                color:
                  handleState.state === "ok" ? "#1d9e75" : handleState.state === "bad" ? "#c33" : "#999",
              }}
            >
              {handleState.state === "ok" ? "✓ " : ""}
              {handleState.msg}
            </span>
          )}
        </div>

        <div style={s.field}>
          <label style={s.label}>Password <span style={s.required}>*</span></label>
          <div style={s.passwordInputContainer}>
            <input type={showPassword ? "text" : "password"} name="password" placeholder={`At least ${MIN_PASSWORD} characters`} value={formData.password} onChange={handleChange} required style={s.input} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} style={s.togglePasswordBtn}>
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <div style={s.field}>
          <label style={s.label}>Confirm Password <span style={s.required}>*</span></label>
          <input type={showPassword ? "text" : "password"} name="confirmPassword" placeholder="Confirm your password" value={formData.confirmPassword} onChange={handleChange} required style={s.input} />
        </div>

        <div style={s.divider} />

        <div style={s.field}>
          <label style={s.label}>I am signing up as... <span style={s.required}>*</span></label>
          {ROLE_GROUPS.map((group) => (
            <div key={group.userType} style={s.roleGroup}>
              <span style={s.roleGroupLabel}>{group.label}</span>
              <div style={s.radioGroup}>
                {group.options.map((opt) => (
                  <label key={opt.role} style={s.radioLabel}>
                    <input type="radio" name="role" value={opt.role} checked={formData.role === opt.role} onChange={handleChange} style={s.radioInput} />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={s.field}>
          <label style={s.label}>Zip Code <span style={s.optional}>(optional)</span></label>
          <input type="text" name="zipCode" placeholder="e.g. 94105" value={formData.zipCode} onChange={handleChange} style={s.input} />
        </div>

        {status === "error" && <div style={s.errorBox}>{error}</div>}

        <button type="submit" disabled={status === "submitting"} style={{ ...s.submitBtn, ...(status === "submitting" ? s.submitBtnDisabled : {}) }}>
          {status === "submitting" ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p style={s.footerText}>
        Already have an account?{" "}
        <Link href="/login" style={s.link}>Log in</Link>
      </p>
    </div>
  );
}
