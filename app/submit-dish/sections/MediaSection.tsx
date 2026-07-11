"use client";

/**
 * Photo/video picker for the recipe intake form — the gallery strip that sits
 * under the cover box. The dish doesn't exist yet while the form is being
 * filled, so files upload to Nhost storage (bucket 'dish-media') the moment
 * they're dropped and are staged here; the form registers them against the
 * dish right after it's created.
 */
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useAuth } from "@/components/AuthProvider";
import { getNhost } from "@/lib/nhost/client";
import { authFetch } from "@/lib/nhost/auth-fetch";
import { storageErrorMessage } from "@/lib/storage-error";

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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (accepted: File[]) => {
      if (!accepted.length) return;
      setBusy(true);
      setError(null);
      const staged: StagedMedia[] = [];
      try {
        // Upload first — sequentially so one bad file reports cleanly — then
        // stage; nothing attaches to the recipe until it's saved.
        for (const file of accepted) {
          const kind = file.type.startsWith("video/") ? "video" : "image";
          const up = await getNhost().storage.uploadFiles({ "bucket-id": "dish-media", "file[]": [file] });
          const fileId = up.body?.processedFiles?.[0]?.id;
          if (!fileId) throw new Error("The upload didn't return a file id — please try again.");
          staged.push({ fileId, kind, preview: URL.createObjectURL(file) });
        }
      } catch (err) {
        setError(storageErrorMessage(err));
      } finally {
        if (staged.length) onChange([...media, ...staged]);
        setBusy(false);
      }
    },
    [media, onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [], "video/*": [] },
    multiple: true,
    disabled: busy || !accessToken,
  });

  async function remove(fileId: string) {
    onChange(media.filter((m) => m.fileId !== fileId));
    // Discard the staged storage object too; best-effort.
    if (accessToken) {
      authFetch("/api/dish-media", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId }),
      }).catch(() => {});
    }
  }

  return (
    <div>
      <span className="text-sm font-medium text-neutral-800">Photos &amp; videos</span>
      <div
        {...getRootProps()}
        className={
          "mt-2 flex min-h-[6rem] w-full cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed px-6 py-5 text-center transition " +
          (isDragActive ? "border-apb bg-apb/10" : "border-neutral-300 bg-neutral-50 hover:border-apb/50 hover:bg-apb/5")
        }
      >
        <input {...getInputProps()} />
        <p className="pointer-events-none text-sm text-neutral-600">
          {busy
            ? "Uploading…"
            : accessToken
              ? "Drag & drop photos or videos for the gallery, or click to browse"
              : "Sign in to add photos & videos"}
        </p>
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
