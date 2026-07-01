"use client";

import { useCallback, useEffect, useRef, type CSSProperties } from "react";
import { useRouter } from "next/navigation";

/**
 * Overlay shell for the intercepted auth routes. Dismisses (router.back) on
 * backdrop click or Escape, locks body scroll, and scrolls internally so tall
 * forms (register) work on small screens.
 */
export function AuthModal({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const sheetRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => router.back(), [router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Pause the landing's expensive background (autoplaying video + film-grain
    // blend) while the modal covers it — avoids compositing it every frame.
    document.body.classList.add("auth-modal-open");
    sheetRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      document.body.classList.remove("auth-modal-open");
    };
  }, [close]);

  return (
    <div role="dialog" aria-modal="true" onClick={close} style={overlay}>
      <div ref={sheetRef} tabIndex={-1} onClick={(e) => e.stopPropagation()} style={sheet}>
        <button type="button" aria-label="Close" onClick={close} style={closeBtn}>
          ×
        </button>
        {children}
      </div>
    </div>
  );
}

const overlay: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 1000,
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "center",
  padding: "6vh 1rem 2rem",
  overflowY: "auto",
  // Solid dim instead of backdrop-filter: blur() — blurring the landing's live
  // hero video every frame was pegging the CPU/GPU and lagging the whole page.
  background: "rgba(12, 26, 17, 0.82)",
};

const sheet: CSSProperties = {
  position: "relative",
  width: "100%",
  maxWidth: 460,
  margin: "auto",
  outline: "none",
};

const closeBtn: CSSProperties = {
  position: "absolute",
  top: 10,
  right: 12,
  zIndex: 2,
  width: 32,
  height: 32,
  display: "grid",
  placeItems: "center",
  fontSize: 22,
  lineHeight: 1,
  color: "#999",
  background: "transparent",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
};
