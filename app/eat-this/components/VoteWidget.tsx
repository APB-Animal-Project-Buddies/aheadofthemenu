"use client";

/**
 * Thumbs vote input ("Was it good?"). The Yum Meter is the output; this is
 * the input. Active vote renders filled; tapping it again removes the vote.
 * Every vote carries a local/visiting answer (defaulted to Local) and, when the
 * dish has customizations, any number the voter had (multi-select) — each feeds
 * that customization's rating breakdown. Signed-out taps show a sign-in prompt.
 */
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { usePersistentState } from "@/lib/usePersistentState";
import { MultiSelect } from "@/components/form/MultiSelect";
import type { MyVote } from "@/lib/reverse-lookup";

export type { MyVote };

export function VoteWidget({ myVote, customizations, onVote }: {
  myVote: MyVote;
  customizations: string[];
  /** value null = remove vote. Caller does the optimistic update + API call. */
  onVote: (value: 1 | 0 | -1 | null, isLocal: boolean, customizations: string[]) => void;
}) {
  const { isAuthenticated } = useAuth();
  const [isLocal, setIsLocal] = usePersistentState<boolean>("rl-voter-is-local", true);
  const [showGate, setShowGate] = useState(false);
  const [selected, setSelected] = useState<string[]>(myVote?.customizations ?? []);

  // Re-sync the picks when the server reconciles our vote (e.g. after a refetch).
  useEffect(() => { setSelected(myVote?.customizations ?? []); }, [myVote?.customizations]);

  const cast = (value: 1 | 0 | -1) => {
    if (!isAuthenticated) { setShowGate(true); return; }
    onVote(myVote?.value === value ? null : value, isLocal, selected);
  };

  const changeCustomizations = (next: string[]) => {
    if (!isAuthenticated) { setShowGate(true); return; }
    setSelected(next);
    // If they've already voted, retag their existing vote with the new set.
    if (myVote) onVote(myVote.value, isLocal, next);
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
    <div className="mt-3">
      <div className="flex flex-wrap items-center gap-2">
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

      {customizations.length > 0 && (
        <div className="mt-2 flex items-center gap-2">
          <span className="shrink-0 text-[10px] font-bold tracking-wide text-neutral-400">HAD</span>
          <MultiSelect
            value={selected}
            onChange={changeCustomizations}
            options={customizations}
            searchable
            placeholder="pick customizations you had…"
            className="min-w-[180px] max-w-[280px] flex-1"
          />
        </div>
      )}
    </div>
  );
}
