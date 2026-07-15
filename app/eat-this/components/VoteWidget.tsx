"use client";

/**
 * Thumbs vote input ("Was it good?"). The Yum Meter is the output; this is
 * the input. Active vote renders filled; tapping it again removes the vote.
 * Every vote carries a local/visiting answer, defaulted to Local and
 * remembered in localStorage so regulars never touch it.
 * Signed-out taps show an inline sign-in prompt instead of voting.
 */
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { usePersistentState } from "@/lib/usePersistentState";
import type { MyVote } from "@/lib/reverse-lookup";

export type { MyVote };

export function VoteWidget({ myVote, onVote }: {
  myVote: MyVote;
  /** value null = remove vote. Caller does the optimistic update + API call. */
  onVote: (value: 1 | 0 | -1 | null, isLocal: boolean) => void;
}) {
  const { isAuthenticated } = useAuth();
  const [isLocal, setIsLocal] = usePersistentState<boolean>("rl-voter-is-local", true);
  const [showGate, setShowGate] = useState(false);

  const cast = (value: 1 | 0 | -1) => {
    if (!isAuthenticated) { setShowGate(true); return; }
    onVote(myVote?.value === value ? null : value, isLocal);
  };

  const btn = (value: 1 | 0 | -1, glyph: string) => (
    <button
      type="button"
      onClick={() => cast(value)}
      aria-pressed={myVote?.value === value}
      className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
        myVote?.value === value
          ? "border-apb bg-apb text-white"
          : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"
      }`}
    >
      {glyph}
    </button>
  );

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold text-neutral-600">Was it good?</span>
      {btn(1, "👍")}
      {btn(0, "😐")}
      {btn(-1, "👎")}
      <button
        type="button"
        onClick={() => setIsLocal(!isLocal)}
        className="ml-1 rounded-full border border-dashed border-neutral-300 px-2.5 py-1 text-[11px] font-medium text-neutral-600 hover:bg-neutral-50"
        title="Your vote counts toward this group's score"
      >
        as {isLocal ? "🏠 Local" : "🧳 Visiting"} ▾
      </button>
      {showGate && (
        <span className="text-xs text-neutral-600">
          <a className="font-semibold text-apb underline" href="/login?next=/eat-this">Sign in</a> to vote — it takes a minute.
        </span>
      )}
    </div>
  );
}
