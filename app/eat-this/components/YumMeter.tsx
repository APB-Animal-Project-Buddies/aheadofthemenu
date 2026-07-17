"use client";

/**
 * Yum Meter — the LOCALS vs VISITORS score output. Each cohort block renders
 * one of three states, all decided by meterState() in lib/eat-this:
 *  - scored:   tier-colored percentage + mood face + vote count
 *  - tallying: gray neutral face, NO percentage (early numbers would anchor voters)
 *  - empty:    gray face, "No votes yet — be the first."
 * ScoreBlock is exported for reuse in the leaderboard rows.
 */
import { CuteFace } from "./CuteFace";
import { meterState, type VoteTotals } from "@/lib/eat-this";

/** Tier key → face fill, from the style sample's palette. */
export const FACE_FILLS: Record<string, string> = {
  love: "#A6D8B0", yum: "#C8E0A0", tasty: "#FFE08A", meh: "#F4B987", skip: "#F2A39A",
};

export function ScoreBlock({ label, totals }: { label: string; totals: VoteTotals }) {
  const s = meterState(totals);
  if (s.state === "scored") {
    return (
      <div className="flex flex-1 items-center gap-2.5 rounded-xl px-3 py-2.5" style={{ background: s.tier.soft }}>
        <CuteFace mood={s.tier.face} fill={FACE_FILLS[s.tier.key]} />
        <div>
          <div className="text-[10px] font-bold tracking-wide text-neutral-500">{label}</div>
          <div className="text-xl font-extrabold leading-tight" style={{ color: s.tier.color }}>
            {s.pct}<span className="text-xs">%</span>
          </div>
          <div className="text-[11px] font-semibold" style={{ color: s.tier.color }}>
            {s.tier.label} <span className="font-normal text-neutral-500">· {s.votes} votes</span>
          </div>
        </div>
      </div>
    );
  }
  // Tallying / empty: neutral gray face, NO percentage (avoids anchoring voters).
  return (
    <div className="flex flex-1 items-center gap-2.5 rounded-xl bg-neutral-100 px-3 py-2.5">
      <CuteFace mood="neutral" fill="#D6D3CE" />
      <div>
        <div className="text-[10px] font-bold tracking-wide text-neutral-500">{label}</div>
        <div className="text-[12px] font-medium text-neutral-500">
          {s.state === "tallying"
            ? <>Still tallying the votes… <span className="whitespace-nowrap">· {s.votes} so far</span></>
            : "No votes yet — be the first."}
        </div>
      </div>
    </div>
  );
}

export function YumMeter({ locals, visitors }: { locals: VoteTotals; visitors: VoteTotals }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <ScoreBlock label="LOCALS SAY" totals={locals} />
      <ScoreBlock label="VISITORS SAY" totals={visitors} />
    </div>
  );
}
