"use client";

/**
 * Shared client-side cache for the creators list (Zustand).
 *
 * One fetch of /api/creators per browser session, shared by every consumer
 * (Original-creator autocomplete on the recipe form, creator filter on the
 * dish library, future creator pages). `load()` is safe to call from any
 * mount: it no-ops while a request is in flight or once results are cached.
 */
import { create } from "zustand";

export type Creator = { display_name: string; creator_name: string | null };

type CreatorsState = {
  creators: Creator[];
  /** Deduped display + brand names, sorted — the autocomplete/filter vocabulary. */
  names: string[];
  status: "idle" | "loading" | "ready" | "error";
  load: () => Promise<void>;
  /** Merge freshly created creator names into the cache (inline add-creator flow). */
  addNames: (names: string[]) => void;
};

export const useCreatorsStore = create<CreatorsState>((set, get) => ({
  creators: [],
  names: [],
  status: "idle",
  load: async () => {
    const { status } = get();
    if (status === "loading" || status === "ready") return;
    set({ status: "loading" });
    try {
      const res = await fetch("/api/creators");
      if (!res.ok) throw new Error(`creators fetch failed: ${res.status}`);
      const json = await res.json();
      const creators: Creator[] = json?.creators ?? [];
      const names = new Set<string>();
      creators.forEach((c) => {
        if (c.display_name) names.add(c.display_name);
        if (c.creator_name) names.add(c.creator_name);
      });
      set({
        creators,
        names: Array.from(names).sort((a, b) => a.localeCompare(b)),
        status: "ready",
      });
    } catch {
      // Consumers degrade gracefully (free-text input, no filter chips);
      // 'error' (not 'ready') so a later load() can retry.
      set({ status: "error" });
    }
  },
  addNames: (names) => {
    const merged = new Set(get().names);
    names.filter(Boolean).forEach((n) => merged.add(n));
    set({ names: Array.from(merged).sort((a, b) => a.localeCompare(b)) });
  },
}));
