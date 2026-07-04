"use client";

/**
 * Recipe gallery: user-contributed photos & videos on a dish page.
 *
 * Files upload straight from the browser to Nhost storage (bucket
 * 'dish-media', user-role permission) — bypassing our API so large videos
 * aren't squeezed through a serverless body limit — then get registered
 * against the dish via POST /api/dish-media.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { getNhost } from "@/lib/nhost/client";

type MediaItem = {
  id: string;
  kind: "image" | "video";
  url: string;
  caption: string | null;
  uploader_id: string | null;
};

export function DishGallery({ dishId }: { dishId: number }) {
  const { session, userId } = useAuth();
  const accessToken = session?.accessToken ?? null;
  const fileInput = useRef<HTMLInputElement | null>(null);

  const [items, setItems] = useState<MediaItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/dish-media?dishId=${dishId}`);
      if (res.ok) setItems((await res.json()).items ?? []);
    } catch {
      /* gallery is progressive enhancement — leave empty on failure */
    }
  }, [dishId]);

  useEffect(() => {
    load();
  }, [load]);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file || !accessToken) return;
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      setError("Only images and videos are allowed.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      // 1) Straight to Nhost storage with the user's session.
      const up = await getNhost().storage.uploadFiles({ "bucket-id": "dish-media", "file[]": [file] });
      const fileId = up.body?.processedFiles?.[0]?.id;
      if (!fileId) throw new Error("upload failed");

      // 2) Register it in this dish's gallery.
      const res = await fetch("/api/dish-media", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ dishId, fileId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "register failed");
      await load();
    } catch (err) {
      setError(err instanceof Error && err.message.includes("large") ? err.message : "Upload failed — try a smaller file (max 100MB).");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!accessToken) return;
    try {
      const res = await fetch("/api/dish-media", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ id }),
      });
      if (res.ok) setItems((prev) => prev.filter((m) => m.id !== id));
    } catch {
      /* leave the item; a reload re-syncs */
    }
  }

  if (items.length === 0 && !accessToken) return null; // nothing to show, nothing to add

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-serif text-xl font-semibold text-apb">Gallery</h2>
        {accessToken && (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => fileInput.current?.click()}
              className="rounded-full border border-apb/40 px-4 py-2 text-sm font-medium text-apb transition hover:bg-apb/5 disabled:opacity-50"
            >
              {busy ? "Uploading…" : "📷 Add photo / video"}
            </button>
            <input ref={fileInput} type="file" accept="image/*,video/*" className="hidden" onChange={onPick} />
          </>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {items.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-500">No photos or videos yet — made this dish? Show it off!</p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((m) => (
            <figure key={m.id} className="group relative overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50">
              {m.kind === "video" ? (
                <video src={m.url} controls playsInline preload="metadata" className="aspect-square h-full w-full object-cover" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element -- nhost storage host isn't in next/image config
                <img src={m.url} alt={m.caption ?? "Dish photo"} loading="lazy" className="aspect-square h-full w-full object-cover" />
              )}
              {m.caption && (
                <figcaption className="absolute inset-x-0 bottom-0 bg-black/50 px-2 py-1 text-xs text-white">
                  {m.caption}
                </figcaption>
              )}
              {userId && m.uploader_id === userId && (
                <button
                  type="button"
                  onClick={() => remove(m.id)}
                  aria-label="Remove"
                  className="absolute right-2 top-2 hidden rounded-full bg-black/60 px-2 py-1 text-xs font-medium text-white group-hover:block"
                >
                  ✕
                </button>
              )}
            </figure>
          ))}
        </div>
      )}
    </section>
  );
}
