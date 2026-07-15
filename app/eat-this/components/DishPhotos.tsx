"use client";

/**
 * Photo strip for a reverse-lookup dish. Signed-in users upload straight to
 * Nhost storage (bucket 'dish-media'), then register the file against the dish
 * via authFetch. Photos show immediately; uploaders can delete their own.
 * Mirrors components/DishGallery.tsx (which is for the main /dishes feature and
 * keyed by a numeric dish id, so this is a separate, additive component).
 */
import { useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { getNhost } from "@/lib/nhost/client";
import { authFetch } from "@/lib/nhost/auth-fetch";
import { storageErrorMessage } from "@/lib/storage-error";

export type DishPhoto = { id: string; url: string; caption: string | null; uploaderId: string | null };

export function DishPhotos({ dishId, photos: initial }: { dishId: string; photos: DishPhoto[] }) {
  const { session, userId } = useAuth();
  const accessToken = session?.accessToken ?? null;
  const fileInput = useRef<HTMLInputElement | null>(null);

  const [photos, setPhotos] = useState<DishPhoto[]>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !accessToken) return;
    if (!file.type.startsWith("image/")) { setError("Only images are allowed."); return; }
    setBusy(true);
    setError(null);
    try {
      const up = await getNhost().storage.uploadFiles({ "bucket-id": "dish-media", "file[]": [file] });
      const fileId = up.body?.processedFiles?.[0]?.id;
      if (!fileId) throw new Error("The upload didn't return a file id — please try again.");
      const res = await authFetch(`/api/eat-this/dishes/${dishId}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Couldn't add that photo.");
      setPhotos((p) => [...p, { id: data.id, url: data.url, caption: null, uploaderId: userId }]);
    } catch (err) {
      setError(storageErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    try {
      const res = await authFetch(`/api/eat-this/dishes/${dishId}/photos`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) setPhotos((p) => p.filter((x) => x.id !== id));
    } catch {
      /* leave it; a reload re-syncs */
    }
  }

  if (photos.length === 0 && !accessToken) return null;

  return (
    <div className="mt-3">
      {photos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {photos.map((m) => (
            <div key={m.id} className="relative h-20 w-20 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50">
              {/* eslint-disable-next-line @next/next/no-img-element -- nhost storage host isn't in next/image config */}
              <img src={m.url} alt={m.caption ?? "Dish photo"} loading="lazy" className="h-full w-full object-cover" />
              {userId && m.uploaderId === userId && (
                <button
                  type="button"
                  onClick={() => remove(m.id)}
                  aria-label="Remove"
                  className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 text-xs font-medium text-white"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {accessToken && (
        <>
          <button
            type="button"
            disabled={busy}
            onClick={() => fileInput.current?.click()}
            className="mt-2 rounded-full border border-apb/40 px-3 py-1.5 text-xs font-medium text-apb transition hover:bg-apb/5 disabled:opacity-50"
          >
            {busy ? "Uploading…" : "📷 Add photo"}
          </button>
          <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={onPick} />
        </>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
