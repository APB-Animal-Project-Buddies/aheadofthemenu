"use client";

/**
 * Flat comments on a reverse-lookup dish. Public comments render here and come
 * from the catalog GET; signed-in users add a comment and choose Public (shown
 * here) or Private to the restaurant (stored as a private message, not shown).
 * Authors can delete their own public comments.
 */
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { authFetch } from "@/lib/nhost/auth-fetch";

export type DishComment = { id: string; body: string; createdAt: string; author: string | null };

type Visibility = "public" | "private_to_restaurant";

export function DishComments({ dishId, comments: initial }: { dishId: string; comments: DishComment[] }) {
  const { isAuthenticated, handle } = useAuth();
  const [comments, setComments] = useState<DishComment[]>(initial);
  const [body, setBody] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [privateSent, setPrivateSent] = useState(false);
  const [showGate, setShowGate] = useState(false);

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
      if (data.visibility === "public" && data.comment) {
        setComments((c) => [...c, { ...data.comment, author: handle ?? null }]);
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
      if (res.ok) setComments((c) => c.filter((x) => x.id !== id));
    } catch {
      /* leave it; a reload re-syncs */
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
      <div className="text-[10px] font-bold tracking-wide text-neutral-400">COMMENTS</div>

      {comments.length > 0 ? (
        <ul className="mt-1.5 flex flex-col gap-1.5">
          {comments.map((c) => (
            <li key={c.id} className="text-sm leading-snug text-neutral-700">
              <span className="font-semibold text-neutral-800">{c.author ? `@${c.author}` : "someone"}</span>{" "}
              {c.body}
              {handle && c.author === handle && (
                <button
                  type="button"
                  onClick={() => remove(c.id)}
                  className="ml-2 align-middle text-[11px] text-neutral-400 hover:text-red-500"
                >
                  delete
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-xs text-neutral-400">No comments yet.</p>
      )}

      <div className="mt-2 flex flex-col gap-1.5">
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
        {privateSent && <p className="text-xs text-apb">Sent privately to the restaurant.</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}
        {showGate && (
          <p className="text-xs text-neutral-600">
            <a className="font-semibold text-apb underline" href="/login?next=/reverse-lookup">Sign in</a> to comment.
          </p>
        )}
      </div>
    </div>
  );
}
