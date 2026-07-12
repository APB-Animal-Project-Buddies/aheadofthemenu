"use client";

/**
 * Flat comments on a reverse-lookup dish, collapsed behind a "Comments" toggle.
 * Public comments come from the catalog GET (most-recent first); the current
 * user's own comment is bubbled to the top and only the top 3 are shown. Signed-
 * in users add one comment per dish (public, or private-to-restaurant) and can
 * like others' comments; authors can delete their own comment.
 */
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { authFetch } from "@/lib/nhost/auth-fetch";

export type DishComment = {
  id: string; body: string; createdAt: string; author: string | null;
  likeCount: number; likedByMe: boolean;
};

type Visibility = "public" | "private_to_restaurant";

export function DishComments({ dishId, comments: initial }: { dishId: string; comments: DishComment[] }) {
  const { isAuthenticated, handle } = useAuth();
  const [comments, setComments] = useState<DishComment[]>(initial);
  const [expanded, setExpanded] = useState(false);
  const [body, setBody] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [privateSent, setPrivateSent] = useState(false);
  const [showGate, setShowGate] = useState(false);
  const [posted, setPosted] = useState(false);

  const isMine = (c: DishComment) => !!handle && c.author === handle;
  const alreadyCommented = posted || comments.some(isMine);

  // Current user's comment first, then most recent; show only the top 3.
  const visible = [...comments]
    .sort((a, b) => {
      const mine = Number(isMine(b)) - Number(isMine(a));
      return mine !== 0 ? mine : b.createdAt.localeCompare(a.createdAt);
    })
    .slice(0, 3);

  const submit = async () => {
    const text = body.trim();
    if (!text) return;
    if (!isAuthenticated) { setShowGate(true); return; }
    setBusy(true);
    setError(null);
    setPrivateSent(false);
    try {
      const res = await authFetch(`/api/reverse-lookup/dishes/${dishId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text, visibility }),
      });
      if (res.status === 401) { setShowGate(true); return; }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data?.error ?? "Couldn't post your comment."); return; }
      setBody("");
      setPosted(true);
      if (data.visibility === "public" && data.comment) {
        setComments((c) => [...c, { ...data.comment, author: handle ?? null, likeCount: 0, likedByMe: false }]);
      } else {
        setPrivateSent(true);
      }
    } catch {
      setError("Couldn't post your comment.");
    } finally {
      setBusy(false);
    }
  };

  async function remove(id: string) {
    try {
      const res = await authFetch(`/api/reverse-lookup/dishes/${dishId}/comments`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setComments((c) => c.filter((x) => x.id !== id));
        setPosted(false); // freed up their single slot — allow a new comment
      }
    } catch {
      /* leave it; a reload re-syncs */
    }
  }

  async function toggleLike(c: DishComment) {
    if (!isAuthenticated) { setShowGate(true); return; }
    const nextLiked = !c.likedByMe;
    const patch = (liked: boolean, count: number) =>
      setComments((list) => list.map((x) => (x.id === c.id ? { ...x, likedByMe: liked, likeCount: count } : x)));
    patch(nextLiked, c.likeCount + (nextLiked ? 1 : -1)); // optimistic
    try {
      const res = await authFetch(`/api/reverse-lookup/comments/${c.id}/like`, {
        method: nextLiked ? "PUT" : "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && typeof data.likeCount === "number") {
        patch(!!data.liked, data.likeCount);
      } else {
        patch(c.likedByMe, c.likeCount); // revert
        if (res.status === 401) setShowGate(true);
      }
    } catch {
      patch(c.likedByMe, c.likeCount); // revert
    }
  }

  const visBtn = (value: Visibility, label: string) => (
    <button
      type="button"
      onClick={() => setVisibility(value)}
      className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
        visibility === value ? "border-apb bg-apb text-white" : "border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-50"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="mt-3 border-t border-neutral-100 pt-3">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1.5 text-[10px] font-bold tracking-wide text-neutral-400 transition hover:text-neutral-600"
        aria-expanded={expanded}
      >
        <span>💬 COMMENTS{comments.length ? ` (${comments.length})` : ""}</span>
        <span className={`transition ${expanded ? "rotate-180" : ""}`}>▾</span>
      </button>

      {expanded && (
        <div className="mt-2">
          {visible.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {visible.map((c) => (
                <li key={c.id} className="text-sm leading-snug text-neutral-700">
                  <div>
                    <span className="font-semibold text-neutral-800">{c.author ? `@${c.author}` : "someone"}</span>{" "}
                    {c.body}
                  </div>
                  <div className="mt-0.5 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleLike(c)}
                      className={`text-xs transition ${c.likedByMe ? "text-red-500" : "text-neutral-400 hover:text-red-500"}`}
                      aria-pressed={c.likedByMe}
                    >
                      {c.likedByMe ? "❤️" : "🤍"}{c.likeCount > 0 ? ` ${c.likeCount}` : ""}
                    </button>
                    {isMine(c) && (
                      <button
                        type="button"
                        onClick={() => remove(c.id)}
                        className="text-[11px] text-neutral-400 hover:text-red-500"
                      >
                        delete
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-neutral-400">No comments yet.</p>
          )}

          <div className="mt-2 flex flex-col gap-1.5">
            {alreadyCommented ? (
              <p className="text-xs text-neutral-400">
                You&rsquo;ve already commented on this dish{privateSent ? "" : " — delete your comment to change it"}.
              </p>
            ) : (
              <>
                <input
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submit(); } }}
                  placeholder="Add a comment…"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-apb focus:outline-none"
                />
                <div className="flex flex-wrap items-center gap-2">
                  {visBtn("public", "Public")}
                  {visBtn("private_to_restaurant", "Private to restaurant")}
                  <button
                    type="button"
                    onClick={submit}
                    disabled={busy || !body.trim()}
                    className="ml-auto rounded-lg bg-apb px-3 py-1.5 text-xs font-semibold text-white transition disabled:opacity-40"
                  >
                    {busy ? "…" : "Post"}
                  </button>
                </div>
              </>
            )}
            {privateSent && <p className="text-xs text-apb">Sent privately to the restaurant.</p>}
            {error && <p className="text-xs text-red-600">{error}</p>}
            {showGate && (
              <p className="text-xs text-neutral-600">
                <a className="font-semibold text-apb underline" href="/login?next=/reverse-lookup">Sign in</a> to join the conversation.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
