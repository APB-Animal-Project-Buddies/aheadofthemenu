"use client";

/**
 * The upload + scorecard surface on /getting-started.
 *
 * No sign-in, no allowance, nothing stored — drop a menu in, get a scorecard
 * back. Three states: idle (dropzone), running (the model call), and the
 * rendered scorecard.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { getNhost } from "@/lib/nhost/client";
import { storageErrorMessage } from "@/lib/storage-error";

/**
 * Above this we can't POST the file to our own API at all — Vercel caps a
 * function's request body at ~4.5MB. Bigger files go direct to Nhost storage
 * instead and we send the server only the returned id.
 */
const DIRECT_POST_MAX_BYTES = 4 * 1024 * 1024;
/** Matches the menu-uploads bucket's own ceiling; rejecting here gives a better
 *  message than the storage service's raw error. */
const MAX_FILE_BYTES = 15 * 1024 * 1024;
/** Above this, try to shrink an image rather than reject it outright. */
const DOWNSCALE_OVER_BYTES = 1.5 * 1024 * 1024;
/** Long-edge cap. A menu stays comfortably legible well below phone-camera resolution. */
const MAX_EDGE_PX = 2200;

/**
 * Re-encodes an oversized photo down to something the model reads just as well.
 * A 12 MP phone shot of a menu is 4-8 MB and pure waste — the text is legible at
 * a fraction of that. PDFs are returned untouched (can't be resampled in the
 * browser without a PDF library), which is why big PDFs still need the
 * direct-to-storage path rather than this.
 * Returns the original on any failure — shrinking is an optimisation, never a gate.
 */
async function shrinkImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.size <= DOWNSCALE_OVER_BYTES) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE_PX / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", 0.85));
    if (!blob || blob.size >= file.size) return file; // no win — keep the original
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

type Example = { excerpt: string; issue: string; suggestion: string };
type Criterion = {
  id: string;
  name: string;
  score: number;
  weight: number;
  status: "good" | "partial" | "poor";
  finding: string;
  examples: Example[];
};
type Scorecard = {
  overall_score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  summary: string;
  menu_stats: { total_dishes: number; plant_based_dishes: number; plant_based_share_pct: number };
  criteria: Criterion[];
  top_recommendations: Array<{ title: string; why: string; example: string; impact: "high" | "medium" | "low" }>;
};

const GRADE_COLOR: Record<string, string> = {
  A: "#2d7a3e", B: "#4f9a55", C: "#c9922a", D: "#e07b1a", F: "#d6533a",
};
const STATUS_STYLE: Record<Criterion["status"], string> = {
  good: "bg-emerald-50 text-emerald-700 border-emerald-200",
  partial: "bg-amber-50 text-amber-700 border-amber-200",
  poor: "bg-red-50 text-red-600 border-red-200",
};
const IMPACT_STYLE: Record<string, string> = {
  high: "bg-apb-accent/15 text-[#b4421f] border-apb-accent/30",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-neutral-100 text-neutral-600 border-neutral-200",
};

function ScoreRing({ score, grade }: { score: number; grade: string }) {
  const r = 76;
  const c = 2 * Math.PI * r;
  const color = GRADE_COLOR[grade] ?? "#2d7a3e";
  // Start fully "empty" and animate to the real offset once mounted.
  const [offset, setOffset] = useState(c);
  useEffect(() => {
    const id = requestAnimationFrame(() => setOffset(c * (1 - Math.min(100, Math.max(0, score)) / 100)));
    return () => cancelAnimationFrame(id);
  }, [c, score]);

  return (
    <div className="relative h-[180px] w-[180px] shrink-0">
      <svg width="180" height="180" viewBox="0 0 180 180" className="-rotate-90">
        <circle cx="90" cy="90" r={r} fill="none" stroke="#e8e3da" strokeWidth="14" />
        <circle
          cx="90" cy="90" r={r} fill="none" stroke={color} strokeWidth="14" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(.2,.8,.2,1) .15s" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-serif text-4xl font-semibold" style={{ color }}>{score}</span>
        <span className="text-xs text-neutral-500">out of 100</span>
      </div>
    </div>
  );
}

export function MenuAnalyzer() {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scorecard, setScorecard] = useState<Scorecard | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const [preparing, setPreparing] = useState(false);
  const [uploading, setUploading] = useState(false);

  /**
   * The in-flight (or finished) storage upload for the currently chosen file.
   *
   * Held in a ref rather than state because nothing renders off it directly and
   * we never want a re-render to restart an upload. Resolves to the Nhost file
   * id, or null if the upload failed — in which case analyse() falls back to
   * POSTing the bytes directly.
   */
  const uploadRef = useRef<Promise<string | null> | null>(null);

  /** Fire-and-forget cleanup for an upload we're not going to use after all. */
  const discard = useCallback((pending: Promise<string | null> | null) => {
    if (!pending) return;
    pending
      .then((fileId) => {
        if (!fileId) return;
        return fetch("/api/getting-started/discard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileId }),
          keepalive: true,
        });
      })
      .catch(() => { /* orphan cleanup is best-effort by definition */ });
  }, []);

  const pick = useCallback(async (f: File | null | undefined) => {
    if (!f) return;
    setError(null);
    setPreparing(true);
    try {
      // Shrink BEFORE checking the ceiling, so a big photo is rescued rather
      // than rejected. Only a file that is still too big after that is refused.
      const prepared = await shrinkImage(f);
      if (prepared.size > MAX_FILE_BYTES) {
        setError(
          prepared.type === "application/pdf"
            ? "That PDF is over 15 MB. Please upload just the food pages."
            : "That image is over 15 MB even after resizing. Please retake it at a lower resolution."
        );
        setFile(null);
        return;
      }

      // Whatever was queued before is now unwanted — bin it so it doesn't sit
      // in the bucket forever.
      discard(uploadRef.current);

      setFile(prepared);

      // Start the upload NOW rather than on submit. The user is still reading
      // the page, so this costs them nothing; by the time they hit the button
      // the bytes are usually already in storage and we just send the id.
      uploadRef.current = getNhost()
        .storage.uploadFiles({ "bucket-id": "menu-uploads", "file[]": [prepared] })
        .then((up) => up.body?.processedFiles?.[0]?.id ?? null)
        .catch((err) => {
          // Not surfaced here: analyse() can still fall back to a direct POST,
          // so a failed prefetch is only fatal for files too big for that path.
          console.error("revamp: prefetch upload failed:", storageErrorMessage(err));
          return null;
        });
    } finally {
      setPreparing(false);
    }
  }, [discard]);

  async function analyse() {
    // `running` guards the double-click / Enter-twice case: the button is
    // disabled while in flight, but the state check makes it airtight.
    if (!file || running) return;
    setRunning(true);
    setError(null);
    setScorecard(null);

    try {
      // The upload was started the moment the file was chosen, so this usually
      // resolves instantly — we're just collecting an id that already exists.
      // Only a user who clicks faster than their own upload actually waits here.
      setUploading(true);
      const fileId = await (uploadRef.current ?? Promise.resolve(null));
      setUploading(false);

      let res: Response;
      if (fileId) {
        // The cheap path: hand the backend an id and let it pull the bytes.
        res = await fetch("/api/getting-started/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileId }),
        });
        // Consumed — the server deletes it, so don't let a later pick() try to.
        uploadRef.current = null;
      } else if (file.size <= DIRECT_POST_MAX_BYTES) {
        // Prefetch failed (storage down, permissions, offline). Small enough to
        // POST straight through, so the feature still works.
        const body = new FormData();
        body.append("menu", file);
        res = await fetch("/api/getting-started/analyze", { method: "POST", body });
      } else {
        // Too big for a direct POST and storage wouldn't take it — nothing left.
        setError("We couldn't upload that menu. Please check your connection and try again.");
        return;
      }

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setError(data?.error ?? "Something went wrong analysing your menu. Please try again.");
        return;
      }
      setScorecard(data.scorecard);
      setFile(null);
      uploadRef.current = null;
      requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch {
      setError("We couldn't reach the analysis service. Check your connection and try again.");
    } finally {
      setUploading(false);
      setRunning(false);
    }
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* uploader */}
      {!running && (
        <div className="rounded-2xl border border-black/[0.07] bg-white p-6">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files?.[0]); }}
            className={`flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 transition ${
              dragging
                ? "border-apb-accent bg-apb-accent/5"
                : "border-neutral-300 hover:border-apb-light hover:bg-apb-cream/50"
            }`}
          >
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-apb-light" aria-hidden>
              <path d="M12 16V4m0 0L7 9m5-5 5 5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" strokeLinecap="round" />
            </svg>
            <span className="mt-3 font-serif text-lg font-semibold text-apb">Drop your menu here</span>
            <span className="mt-1 text-sm text-neutral-500">
              or click to upload a PDF or photo (JPG, PNG, WEBP) · up to 15 MB · 40 pages max
            </span>
            {preparing && (
              <span className="mt-4 text-sm text-neutral-500">Preparing your file…</span>
            )}
            {file && !preparing && (
              <span className="mt-4 rounded-full bg-apb-cream px-4 py-1.5 text-sm font-medium text-apb">
                📄 {file.name} · {(file.size / (1024 * 1024)).toFixed(1)} MB
              </span>
            )}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,image/*"
            className="hidden"
            onChange={(e) => pick(e.target.files?.[0])}
          />
          <div className="mt-5 text-center">
            <button
              type="button"
              disabled={!file || preparing}
              onClick={analyse}
              className="inline-flex items-center gap-2 rounded-full bg-apb-accent px-7 py-3 font-semibold text-[#112619] transition hover:bg-apb-accent-light disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500"
            >
              Score my menu
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </button>
            <p className="mt-3 text-xs text-neutral-500">
              No sign-up needed. Your menu is analysed on upload and isn&rsquo;t stored.
            </p>
          </div>
        </div>
      )}

      {/* running */}
      {running && (
        <div className="rounded-2xl border border-black/[0.07] bg-white px-6 py-16 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-[3px] border-apb-cream border-t-apb-accent" />
          <h3 className="mt-5 font-serif text-xl font-semibold text-apb">
            {uploading ? "Uploading your menu…" : "Reading your menu…"}
          </h3>
          <p className="mx-auto mt-2 max-w-md text-[15px] text-neutral-600">
            We&rsquo;re tasting every dish and checking it against the eight moves. This usually takes under a minute.
          </p>
        </div>
      )}

      {/* scorecard */}
      {scorecard && (
        <div ref={resultRef} className="mt-8 scroll-mt-24">
          <div className="rounded-2xl border border-black/[0.07] bg-white p-6 md:p-8">
            <div className="flex flex-col items-center gap-7 md:flex-row md:items-start">
              <div className="flex flex-col items-center">
                <ScoreRing score={scorecard.overall_score} grade={scorecard.grade} />
                <span
                  className="mt-2 rounded-full px-4 py-1 text-sm font-semibold text-white"
                  style={{ background: GRADE_COLOR[scorecard.grade] ?? "#2d7a3e" }}
                >
                  Grade {scorecard.grade}
                </span>
              </div>
              <div className="flex-1">
                <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-apb-light">Your menu scorecard</div>
                <p className="mt-2 text-[17px] leading-relaxed text-neutral-700">{scorecard.summary}</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {[
                    [scorecard.menu_stats?.total_dishes, "dishes on the menu"],
                    [scorecard.menu_stats?.plant_based_dishes, "plant-based dishes"],
                    [`${scorecard.menu_stats?.plant_based_share_pct ?? 0}%`, "of the menu is plant-based"],
                  ].map(([v, l]) => (
                    <div key={String(l)} className="rounded-xl bg-apb-cream px-4 py-3">
                      <div className="font-serif text-2xl font-semibold text-apb">{v ?? "—"}</div>
                      <div className="mt-0.5 text-xs text-neutral-600">{l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {scorecard.top_recommendations?.length > 0 && (
            <div className="mt-6">
              <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-apb-light">Start here</div>
              <h3 className="mt-1 text-2xl font-semibold text-apb">Your biggest opportunities</h3>
              <ol className="mt-4 space-y-3">
                {scorecard.top_recommendations.map((r, i) => (
                  <li key={i} className="flex gap-4 rounded-2xl border border-black/[0.07] bg-white p-5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-apb-accent font-serif font-semibold text-[#112619]">{i + 1}</span>
                    <div>
                      <h4 className="flex flex-wrap items-center gap-2 text-lg font-semibold text-apb">
                        {r.title}
                        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] ${IMPACT_STYLE[r.impact] ?? IMPACT_STYLE.low}`}>
                          {r.impact} impact
                        </span>
                      </h4>
                      <p className="mt-1 text-[15px] leading-relaxed text-neutral-600">{r.why}</p>
                      {r.example && (
                        <p className="mt-2 rounded-xl border-l-[3px] border-apb-light bg-apb-cream px-4 py-2.5 text-[14px] text-apb">{r.example}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div className="mt-8">
            <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-apb-light">The full breakdown</div>
            <h3 className="mt-1 text-2xl font-semibold text-apb">How you scored on the eight moves</h3>
            <div className="mt-4 space-y-3">
              {(scorecard.criteria ?? []).map((c) => (
                <div key={c.id} className="rounded-2xl border border-black/[0.07] bg-white p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-lg font-semibold text-apb">{c.name}</h4>
                    <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] ${STATUS_STYLE[c.status] ?? STATUS_STYLE.partial}`}>
                      {c.status}
                    </span>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-100">
                    <div
                      className="h-full rounded-full transition-[width] duration-700"
                      style={{
                        width: `${Math.max(3, Math.min(100, c.score))}%`,
                        background: c.status === "good" ? "#2d7a3e" : c.status === "partial" ? "#c9922a" : "#d6533a",
                      }}
                    />
                  </div>
                  <p className="mt-3 text-[15px] leading-relaxed text-neutral-600">{c.finding}</p>
                  {(c.examples ?? []).map((ex, i) => (
                    <div key={i} className="mt-3 rounded-xl bg-apb-cream px-4 py-3">
                      <p className="text-[14px] italic text-apb">
                        <span className="mr-2 rounded bg-white px-1.5 py-0.5 text-[10px] font-semibold uppercase not-italic tracking-wide text-neutral-500">On your menu</span>
                        &ldquo;{ex.excerpt}&rdquo;
                      </p>
                      {ex.issue && <p className="mt-1.5 text-[14px] text-neutral-600">{ex.issue}</p>}
                      {ex.suggestion && (
                        <p className="mt-1.5 text-[14px] font-medium text-apb">
                          <span className="mr-2 rounded bg-apb-accent/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#b4421f]">Try</span>
                          {ex.suggestion}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => { setScorecard(null); setFile(null); }}
              className="rounded-full border border-black/15 px-6 py-2.5 font-medium text-apb transition hover:border-apb"
            >
              Revamp another menu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
