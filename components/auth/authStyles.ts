/**
 * components/auth/authStyles.ts
 *
 * Shared inline styles for the auth forms (LoginForm / RegisterForm). The forms
 * render the card (`formCard`) inward; the full-page routes wrap it in
 * `container`, while the modal provides its own shell.
 */
import type { CSSProperties } from "react";

export const authStyles: Record<string, CSSProperties> = {
  // page-level wrapper (full-page routes only; the modal supplies its own)
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1rem",
    background: "linear-gradient(135deg, #f5f5f3 0%, #fafafa 100%)",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  formCard: {
    background: "white",
    border: "1px solid #e0e0e0",
    borderRadius: 12,
    padding: "2rem",
    maxWidth: 460,
    width: "100%",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  title: { fontSize: 28, fontWeight: 600, margin: "0 0 0.5rem 0", color: "#1a1a1a" },
  subtitle: { fontSize: 14, color: "#666", margin: "0 0 2rem 0" },
  form: { display: "flex", flexDirection: "column", gap: "1.5rem" },
  field: { display: "flex", flexDirection: "column", gap: "0.5rem" },
  label: { fontSize: 14, fontWeight: 500, color: "#1a1a1a" },
  required: { color: "#d85a30", marginLeft: 2 },
  optional: { fontSize: 12, color: "#999", fontWeight: 400, marginLeft: 6 },
  input: {
    padding: "10px 12px",
    fontSize: 14,
    border: "1px solid #ddd",
    borderRadius: 6,
    fontFamily: "inherit",
    color: "#1a1a1a",
  },
  passwordInputContainer: { display: "flex", alignItems: "center", gap: "0.5rem" },
  togglePasswordBtn: {
    padding: "6px 12px",
    fontSize: 12,
    background: "white",
    color: "#666",
    border: "1px solid #ddd",
    borderRadius: 4,
    cursor: "pointer",
    fontFamily: "inherit",
    whiteSpace: "nowrap",
  },
  divider: { height: 1, background: "#e0e0e0", margin: "0.5rem 0" },
  // role picker (register)
  roleGroup: { display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.25rem" },
  roleGroupLabel: {
    fontSize: 12,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    color: "#999",
  },
  radioGroup: { display: "flex", flexDirection: "column", gap: "0.75rem", paddingLeft: "0.25rem" },
  radioLabel: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: 14,
    color: "#1a1a1a",
    cursor: "pointer",
  },
  radioInput: { cursor: "pointer", accentColor: "#d85a30" },
  // error + resend
  errorBox: {
    display: "flex",
    flexDirection: "column",
    gap: "0.6rem",
    padding: "12px",
    background: "#fee",
    border: "1px solid #fcc",
    borderRadius: 6,
    color: "#c33",
    fontSize: 13,
    lineHeight: 1.45,
  },
  resendRow: { borderTop: "1px solid #fbd5d5", paddingTop: "0.6rem" },
  resendBtn: {
    padding: "8px 12px",
    fontSize: 13,
    fontWeight: 500,
    background: "white",
    color: "#c33",
    border: "1px solid #f0b4b4",
    borderRadius: 6,
    cursor: "pointer",
    fontFamily: "inherit",
    width: "100%",
  },
  resendSent: { color: "#1d9e75", fontWeight: 500 },
  // submit + links
  submitBtn: {
    padding: "12px 16px",
    fontSize: 15,
    fontWeight: 500,
    background: "#d85a30",
    color: "white",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  submitBtnDisabled: { background: "#ccc", cursor: "not-allowed" },
  footerText: { textAlign: "center", fontSize: 14, color: "#666", margin: "1rem 0 0 0" },
  link: { color: "#d85a30", textDecoration: "none", fontWeight: 500, background: "none", border: "none", cursor: "pointer", font: "inherit", padding: 0 },
  forgotRow: { marginTop: "-0.75rem", textAlign: "right", fontSize: 13 },
  // success states
  successBox: { textAlign: "center", padding: "2rem" },
  successIcon: { fontSize: 48, color: "#1d9e75", marginBottom: "1rem" },
  successHeading: { fontSize: 24, fontWeight: 600, marginBottom: "0.5rem", color: "#1a1a1a" },
  successText: { fontSize: 15, color: "#666", lineHeight: 1.6 },
};
