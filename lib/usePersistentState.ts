"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * State that persists to localStorage. SSR-safe: renders `initial` on the
 * server and first client paint (avoiding hydration mismatch), then hydrates
 * from storage on mount. Writes are mirrored to localStorage.
 *
 *   const [pathPref, setPathPref] = usePersistentState<"business" | "consumer">(
 *     "aotm:path", "consumer"
 *   );
 */
export function usePersistentState<T>(
  key: string,
  initial: T
): [T, (value: T | ((prev: T) => T)) => void, boolean] {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw != null) setValue(JSON.parse(raw) as T);
    } catch {
      /* ignore malformed/unavailable storage */
    }
    setHydrated(true);
  }, [key]);

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        try {
          localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          /* ignore */
        }
        return resolved;
      });
    },
    [key]
  );

  return [value, set, hydrated];
}
