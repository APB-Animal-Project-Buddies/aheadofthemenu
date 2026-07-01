"use client";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const fmt = (s: string, labels?: Record<string, string>) => labels?.[s] ?? s.replace(/_/g, " ");

/**
 * Compact multi-select dropdown. Same value/onChange/options/labels API as
 * ChipGroup, but collapses to a single trigger to reduce visual clutter when
 * there are many options (e.g. cuisines). Opens a checklist panel; closes on
 * outside click.
 */
export function MultiSelect({
  value,
  onChange,
  options,
  labels,
  placeholder = "—",
  className,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  options: readonly string[];
  labels?: Record<string, string>;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const toggle = (o: string) =>
    onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o]);

  const summary = value.length ? value.map((v) => fmt(v, labels)).join(", ") : placeholder;

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-left text-sm outline-none focus:border-apb"
      >
        <span className={cn("truncate", !value.length && "text-neutral-400")}>{summary}</span>
        <span className="shrink-0 text-neutral-400">▾</span>
      </button>
      {open ? (
        <div
          role="listbox"
          aria-multiselectable="true"
          className="absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-neutral-200 bg-white shadow"
        >
          {options.map((o) => {
            const on = value.includes(o);
            return (
              <button
                key={o}
                type="button"
                role="option"
                aria-selected={on}
                onClick={() => toggle(o)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm capitalize hover:bg-apb-cream"
              >
                <span
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] text-white",
                    on ? "border-apb bg-apb" : "border-neutral-300 bg-white"
                  )}
                >
                  {on ? "✓" : ""}
                </span>
                {fmt(o, labels)}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
