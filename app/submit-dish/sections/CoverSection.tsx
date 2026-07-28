"use client";

/**
 * Cover-photo picker for the recipe intake form — exactly one image, separate
 * from the gallery, presented as a large dropzone at the top of the form. The
 * file uploads to the dish-media bucket the moment it's picked (upload first,
 * attach later); its public URL is stored in dish_data.image, which is what
 * the dish cards and share pages render.
 */
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useAuth } from "@/components/AuthProvider";
import { getNhost, nhostFileUrl } from "@/lib/nhost/client";
import { authFetch } from "@/lib/nhost/auth-fetch";
import { storageErrorMessage } from "@/lib/storage-error";

export type CoverImage = { fileId: string | null; url: string };

export function CoverSection({
  cover,
  onChange,
}: {
  cover: CoverImage | null;
  onChange: (next: CoverImage | null) => void;
}) {
  const { session } = useAuth();
  const accessToken = session?.accessToken ?? null;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const discardStaged = useCallback(
    (fileId: string | null) => {
      // Best-effort cleanup of a staged upload that won't be used.
      if (fileId && accessToken) {
        authFetch("/api/dish-media", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileId }),
        }).catch(() => {});
      }
    },
    [accessToken]
  );

  const onDrop = useCallback(
    async (accepted: File[]) => {
      const file = accepted[0];
      if (!file) return;
      setBusy(true);
      setError(null);
      try {
        // Upload first; the recipe only ever references the finished file.
        const up = await getNhost().storage.uploadFiles({ "bucket-id": "dish-media", "file[]": [file] });
        const fileId = up.body?.processedFiles?.[0]?.id;
        if (!fileId) throw new Error("The upload didn't return a file id — please try again.");
        const replaced = cover;
        onChange({ fileId, url: nhostFileUrl(fileId) });
        discardStaged(replaced?.fileId ?? null);
      } catch (err) {
        setError(storageErrorMessage(err));
      } finally {
        setBusy(false);
      }
    },
    [cover, onChange, discardStaged]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: false,
    disabled: busy || !accessToken,
  });

  return (
    <div>
      <span className="text-sm font-medium text-neutral-800">Cover photo</span>
      <div
        {...getRootProps()}
        className={
          "relative mt-2 flex h-52 w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition " +
          (isDragActive
            ? "border-apb bg-apb/10"
            : cover
              ? "border-transparent"
              : "border-neutral-300 bg-neutral-50 hover:border-apb/50 hover:bg-apb/5")
        }
      >
        <input {...getInputProps()} />
        {cover ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- nhost storage host isn't in next/image config */}
            <img src={cover.url} alt="Cover preview" className="h-full w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/60 to-transparent px-4 py-3 text-xs font-medium text-white">
              <span>{busy ? "Uploading…" : "Click or drop to replace"}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  discardStaged(cover.fileId);
                  onChange(null);
                }}
                className="rounded-full bg-black/50 px-3 py-1"
              >
                ✕ Remove
              </button>
            </div>
          </>
        ) : (
          <div className="pointer-events-none px-6 text-center">
            <div className="text-3xl">📷</div>
            <p className="mt-2 text-sm font-medium text-neutral-700">
              {busy ? "Uploading…" : accessToken ? "Drag & drop a cover photo, or click to browse" : "Sign in to add a cover photo"}
            </p>
            <p className="mt-1 text-xs text-neutral-500">One image, shown on the dish card.</p>
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
