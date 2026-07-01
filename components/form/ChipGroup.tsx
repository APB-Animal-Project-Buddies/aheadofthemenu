"use client";
import { cn } from "@/lib/utils";

/** Reusable multi-select pill group. Toggles values in a string[]. */
export function ChipGroup({
  value,
  onChange,
  options,
  labels,
  className,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  options: readonly string[];
  labels?: Record<string, string>;
  className?: string;
}) {
  const toggle = (o: string) =>
    onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o]);

  return (
    <div className={cn("mt-2 flex flex-wrap gap-2", className)}>
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button
            key={o}
            type="button"
            aria-pressed={on}
            onClick={() => toggle(o)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition",
              on
                ? "border-apb bg-apb text-white"
                : "border-neutral-300 bg-white text-neutral-700 hover:border-apb"
            )}
          >
            {labels?.[o] ?? o.replace(/_/g, " ")}
          </button>
        );
      })}
    </div>
  );
}
