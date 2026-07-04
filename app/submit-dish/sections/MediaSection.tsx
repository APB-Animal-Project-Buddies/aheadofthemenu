"use client";

/**
 * Photo/video picker for the recipe intake form. The dish doesn't exist yet
 * while the form is being filled, so files upload to Nhost storage (bucket
 * 'dish-media') the moment they're picked and are staged here; the form
 * registers them against the dish right after it's created.
 */
import { useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { getNhost } from "@/lib/nhost/client";

export type StagedMedia = { fileId: string; kind: "image" | "video"; preview: string };

export function MediaSection({
  media,
  onChange,
}: {
  media: StagedMedia[];
  onChange: (next: StagedMedia[]) => void;
}) {
  const { session } = useAuth();
  const accessToken = session?.accessToken ?? null;
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const kind = file.type.startsWith("video/") ? "video" : file.type.startsWith("image/") ? "image" : null;
    if (!kind) {
      setError("Only images and videos are allowed.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const up = await getNhost().storage.uploadFiles({ "bucket-id": "dish-media", "file[]": [file] });
      const fileId = up.body?.processedFiles?.[0]?.id;
      if (!fileId) throw new Error("upload failed");
      onChange([...media, { fileId, kind, preview: URL.createObjectURL(file) }]);
    } catch {
      setError("Upload failed — try a smaller file (max 100MB).");
    } finally {
      setBusy(false);
    }
  }

  async function remove(fileId: string) {
    onChange(media.filter((m) => m.fileId !== fileId));
    // Discard the staged storage object too; best-effort.
    if (accessToken) {
      fetch("/api/dish-media", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ fileId }),
      }).catch(() => {});
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <span className="text-sm font-medium text-neutral-800">Photos &amp; videos</span>
          <p className="text-xs text-neutral-500">Show the dish off — they&rsquo;ll appear in its gallery.</p>
        </div>
        {accessToken ? (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => fileInput.current?.click()}
              className="rounded-full border border-apb/40 px-4 py-2 text-sm font-medium text-apb transition hover:bg-apb/5 disabled:opacity-50"
            >
              {busy ? "Uploading…" : "📷 Add"}
            </button>
            <input ref={fileInput} type="file" accept="image/*,video/*" className="hidden" onChange={onPick} />
          </>
        ) : (
          <span className="text-xs text-neutral-500">Sign in to add media</span>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

      {media.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {media.map((m) => (
            <div key={m.fileId} className="relative h-20 w-20 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50">
              {m.kind === "video" ? (
                <video src={m.preview} muted playsInline className="h-full w-full object-cover" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
                <img src={m.preview} alt="Upload preview" className="h-full w-full object-cover" />
              )}
              <button
                type="button"
                onClick={() => remove(m.fileId)}
                aria-label="Remove"
                className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 text-xs font-medium text-white"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
