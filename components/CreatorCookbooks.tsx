"use client";

/**
 * Featured cookbooks on a creator page (creators.cookbooks). Public: a row of
 * cards (cover, title, blurb) linking out. Owner: same cards with a remove
 * control, plus a small add form (title + link, optional cover upload).
 * Saves the whole array through PATCH /api/creators/mine like the gallery.
 */
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authFetch } from "@/lib/nhost/auth-fetch";
import { storageErrorMessage } from "@/lib/storage-error";
import { uploadImage } from "@/lib/upload-image";
import { MAX_COOKBOOKS, type Cookbook } from "@/lib/creators";

export function CreatorCookbooks({
  items,
  editable = false,
  onChange,
}: {
  items: Cookbook[];
  editable?: boolean;
  onChange?: (next: Cookbook[]) => void;
}) {
  const coverRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [cover, setCover] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!editable && items.length === 0) return null;

  async function persist(next: Cookbook[], msg: string) {
    const res = await authFetch("/api/creators/mine", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cookbooks: next }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || "Couldn't save cookbooks");
    onChange?.(data?.creator?.cookbooks ?? next);
    toast.success(msg);
  }

  async function pickCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      setCover(await uploadImage(file));
    } catch (err) {
      setError(storageErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function add() {
    if (!title.trim()) return setError("Give the cookbook a title.");
    if (!/^https:\/\/.+/i.test(url.trim())) return setError("The link needs to start with https://");
    if (items.length >= MAX_COOKBOOKS) return setError(`You can feature up to ${MAX_COOKBOOKS} cookbooks.`);
    setBusy(true);
    setError(null);
    try {
      const item: Cookbook = { title: title.trim(), url: url.trim(), ...(cover ? { cover } : {}) };
      await persist([...items, item], "Cookbook added");
      setTitle("");
      setUrl("");
      setCover(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(c: Cookbook) {
    setBusy(true);
    setError(null);
    try {
      await persist(items.filter((x) => x.url !== c.url), "Removed");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-12">
      <h2 className="mb-3 text-xl font-bold text-apb">Cookbooks</h2>

      {items.length ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {items.map((c) => (
            <div key={c.url} className="relative">
              <a
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block overflow-hidden rounded-[16px] border border-neutral-200 bg-white/60 transition hover:border-apb"
              >
                {c.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element -- Nhost storage host not in next/image config
                  <img src={c.cover} alt={c.title} loading="lazy" className="aspect-[3/4] w-full object-cover" />
                ) : (
                  <div className="flex aspect-[3/4] w-full items-center justify-center bg-apb/5 text-4xl">📖</div>
                )}
                <div className="p-3">
                  <p className="text-sm font-semibold leading-snug text-neutral-800 group-hover:text-apb">{c.title}</p>
                  {c.blurb ? <p className="mt-1 line-clamp-2 text-xs text-neutral-500">{c.blurb}</p> : null}
                  <p className="mt-1 text-xs font-medium text-apb">Get the book ↗</p>
                </div>
              </a>
              {editable ? (
                <button
                  type="button"
                  onClick={() => remove(c)}
                  aria-label={`Remove ${c.title}`}
                  title="Remove"
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-red-600"
                >
                  ✕
                </button>
              ) : null}
            </div>
          ))}
        </div>
      ) : editable ? (
        <p className="text-sm text-neutral-400">Feature your cookbooks here — title, a link to buy it, and optionally a cover.</p>
      ) : null}

      {editable && items.length < MAX_COOKBOOKS ? (
        <div className="mt-4 rounded-[16px] border border-dashed border-apb/40 bg-apb/5 p-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <Input value={title} placeholder="Cookbook title" onChange={(e) => setTitle(e.target.value)} disabled={busy} />
            <Input type="url" value={url} placeholder="https://… (where to buy)" onChange={(e) => setUrl(e.target.value)} disabled={busy} />
          </div>
          <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={pickCover} disabled={busy} />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => coverRef.current?.click()}
              disabled={busy}
              className="rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
            >
              {cover ? "Change cover" : "Add cover (optional)"}
            </button>
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover} alt="" className="h-10 w-8 rounded object-cover" />
            ) : null}
            <Button type="button" onClick={add} disabled={busy || !title.trim() || !url.trim()} className="ml-auto rounded-full px-4 py-2 text-sm">
              {busy ? "Working…" : "Add cookbook"}
            </Button>
          </div>
          {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
        </div>
      ) : null}
    </section>
  );
}
