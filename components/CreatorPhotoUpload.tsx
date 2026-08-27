"use client";

/**
 * Owner-only profile-photo control for the creator page: pick an image →
 * upload straight to Nhost storage (bucket "dish-media", same path as
 * DishGallery) → save the file's public URL as creators.image_url through
 * PATCH /api/creators/mine. "Remove" clears image_url (the storage object is
 * left in place; it may be referenced from a cached page for a while).
 */
import { useRef, useState } from "react";
import { toast } from "sonner";
import { authFetch } from "@/lib/nhost/auth-fetch";
import { storageErrorMessage } from "@/lib/storage-error";
import { uploadImage } from "@/lib/upload-image";

export function CreatorPhotoUpload({
  currentUrl,
  onSaved,
}: {
  currentUrl: string | null;
  onSaved: (url: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveUrl(url: string) {
    const res = await authFetch("/api/creators/mine", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl: url }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || "Couldn't save the photo");
  }

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const url = await uploadImage(file);
      await saveUrl(url);
      onSaved(url);
      toast.success("Photo updated");
    } catch (err) {
      setError(storageErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      await saveUrl("");
      onSaved(null);
      toast.success("Photo removed");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onPick} disabled={busy} />
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-full bg-apb px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <path d="m17 8-5-5-5 5" />
            <path d="M12 3v12" />
          </svg>
          {busy ? "Uploading…" : currentUrl ? "Change photo" : "Upload photo"}
        </button>
        {currentUrl ? (
          <button type="button" onClick={remove} disabled={busy} className="text-xs text-neutral-500 hover:underline disabled:opacity-50">
            Remove
          </button>
        ) : null}
      </div>
      <p className="text-xs text-neutral-400">JPG, PNG or WebP, up to 8 MB. Square images look best.</p>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
