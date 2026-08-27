"use client";

/**
 * Creator-page gallery: uploaded photos + YouTube/TikTok/Instagram embeds,
 * stored as creators.gallery (see lib/creators.ts GalleryItem). Renders in two
 * modes from the same markup:
 *   - read-only (visitors): photo grid, click-to-load videos (reuses
 *     VideoEmbeds from the dish page), Instagram post embeds.
 *   - editable (owner): the same, plus "Add photos", "Add a link", and a
 *     remove control per tile. Every change PATCHes the whole array through
 *     /api/creators/mine and reports back via onChange.
 */
import { useRef, useState } from "react";
import { toast } from "sonner";
import { VideoEmbeds } from "@/components/VideoEmbeds";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authFetch } from "@/lib/nhost/auth-fetch";
import { storageErrorMessage } from "@/lib/storage-error";
import { uploadImage } from "@/lib/upload-image";
import { parseGalleryLink, MAX_GALLERY_ITEMS, type GalleryItem } from "@/lib/creators";

const itemKey = (g: GalleryItem) =>
  g.kind === "image" ? `image:${g.url}` : g.kind === "video" ? `video:${g.platform}:${g.id}` : `instagram:${g.id}`;

function RemoveButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-red-600"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
        <path d="M18 6 6 18M6 6l12 12" />
      </svg>
    </button>
  );
}

export function CreatorGallery({
  items,
  editable = false,
  onChange,
}: {
  items: GalleryItem[];
  editable?: boolean;
  onChange?: (next: GalleryItem[]) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState("");
  const [error, setError] = useState<string | null>(null);

  const images = items.filter((g): g is Extract<GalleryItem, { kind: "image" }> => g.kind === "image");
  const videos = items.filter((g): g is Extract<GalleryItem, { kind: "video" }> => g.kind === "video");
  const posts = items.filter((g): g is Extract<GalleryItem, { kind: "instagram" }> => g.kind === "instagram");

  if (!editable && items.length === 0) return null;

  async function persist(next: GalleryItem[], successMsg: string) {
    const res = await authFetch("/api/creators/mine", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gallery: next }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || "Couldn't save the gallery");
    onChange?.(data?.creator?.gallery ?? next);
    toast.success(successMsg);
  }

  async function addFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    const room = MAX_GALLERY_ITEMS - items.length;
    if (room <= 0) return setError(`The gallery is full (${MAX_GALLERY_ITEMS} items). Remove something first.`);
    setBusy(true);
    setError(null);
    try {
      const urls: string[] = [];
      for (const f of files.slice(0, room)) urls.push(await uploadImage(f));
      await persist([...items, ...urls.map((url) => ({ kind: "image" as const, url }))], `${urls.length} photo${urls.length === 1 ? "" : "s"} added`);
      if (files.length > room) setError(`Only ${room} of ${files.length} photos were added — the gallery holds ${MAX_GALLERY_ITEMS}.`);
    } catch (err) {
      setError(storageErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function addLink() {
    const parsed = parseGalleryLink(link);
    if (!parsed) return setError("That doesn't look like a YouTube, TikTok or Instagram post link.");
    if (items.some((g) => itemKey(g) === itemKey(parsed))) return setError("That one's already in the gallery.");
    if (items.length >= MAX_GALLERY_ITEMS) return setError(`The gallery is full (${MAX_GALLERY_ITEMS} items). Remove something first.`);
    setBusy(true);
    setError(null);
    try {
      await persist([...items, parsed], "Link added");
      setLink("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(g: GalleryItem) {
    setBusy(true);
    setError(null);
    try {
      await persist(items.filter((x) => itemKey(x) !== itemKey(g)), "Removed");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-xl font-bold text-apb">Gallery</h2>

      {editable && (
        <div className="mb-4 rounded-[16px] border border-dashed border-apb/40 bg-apb/5 p-4">
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={addFiles} disabled={busy} />
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className="rounded-full px-4 py-2 text-sm">
              {busy ? "Working…" : "Add photos"}
            </Button>
            <div className="flex min-w-[240px] flex-1 items-center gap-2">
              <Input
                type="url"
                value={link}
                placeholder="Paste a YouTube, TikTok or Instagram post link"
                onChange={(e) => setLink(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addLink();
                }}
                disabled={busy}
              />
              <Button type="button" onClick={addLink} disabled={busy || !link.trim()} className="rounded-full px-4 py-2 text-sm">
                Add link
              </Button>
            </div>
          </div>
          <p className="mt-2 text-xs text-neutral-500">
            Up to {MAX_GALLERY_ITEMS} items · {items.length} so far. Photos up to 8 MB each.
          </p>
          {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-neutral-400">Nothing here yet — add a few photos or links so visitors can see your work.</p>
      ) : null}

      {images.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((g) => (
            <figure key={itemKey(g)} className="relative aspect-square overflow-hidden rounded-[16px] border border-neutral-200 bg-neutral-100">
              {/* eslint-disable-next-line @next/next/no-img-element -- Nhost storage host not in next/image config */}
              <img src={g.url} alt={g.caption ?? ""} loading="lazy" className="h-full w-full object-cover" />
              {editable ? <RemoveButton onClick={() => remove(g)} label="Remove photo" /> : null}
            </figure>
          ))}
        </div>
      ) : null}

      {videos.length ? (
        <div className={images.length ? "mt-4" : ""}>
          <VideoEmbeds embeds={videos.map(({ platform, id, url }) => ({ platform, id, url }))} />
          {editable ? (
            <ul className="mt-2 flex flex-wrap gap-2">
              {videos.map((g) => (
                <li key={itemKey(g)} className="flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-neutral-700">
                  {g.platform === "youtube" ? "YouTube" : "TikTok"} · {g.id.slice(0, 12)}
                  <button type="button" onClick={() => remove(g)} aria-label="Remove video" className="ml-1 text-neutral-400 hover:text-red-600">
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {posts.length ? (
        <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${images.length || videos.length ? "mt-4" : ""}`}>
          {posts.map((g) => (
            <figure key={itemKey(g)} className="relative overflow-hidden rounded-[16px] border border-neutral-200 bg-white">
              <iframe
                src={`https://www.instagram.com/p/${g.id}/embed/`}
                title="Instagram post"
                loading="lazy"
                className="h-[560px] w-full"
                allow="encrypted-media; clipboard-write"
              />
              {editable ? <RemoveButton onClick={() => remove(g)} label="Remove Instagram post" /> : null}
            </figure>
          ))}
        </div>
      ) : null}
    </section>
  );
}
