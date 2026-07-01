"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";

// Searchable multi-select that also accepts free-text "add your own". Picks from
// a curated option list (e.g. special products) but never traps the user inside
// it. Value is a string[]; selected items render as removable chips.
export function TagCombobox({
  value,
  onChange,
  options,
  placeholder = "Search or add your own…",
}: {
  value: string[];
  onChange: (next: string[]) => void;
  options: readonly string[];
  placeholder?: string;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const query = q.trim();
  const lower = query.toLowerCase();
  const selected = new Set(value.map((x) => x.toLowerCase()));
  const matches = options
    .filter((o) => !selected.has(o.toLowerCase()) && (lower === "" || o.toLowerCase().includes(lower)))
    .slice(0, 8);
  const exact = selected.has(lower) || options.some((o) => o.toLowerCase() === lower);

  const add = (item: string) => {
    const t = item.trim();
    if (!t || selected.has(t.toLowerCase())) return;
    onChange([...value, t]);
    setQ("");
  };
  const remove = (item: string) => onChange(value.filter((x) => x !== item));

  return (
    <div className="mt-2">
      {value.length ? (
        <div className="mb-2 flex flex-wrap gap-2">
          {value.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 rounded-full border border-apb bg-apb px-3 py-1 text-sm text-white"
            >
              {t}
              <button
                type="button"
                aria-label={`Remove ${t}`}
                className="leading-none text-white/80 hover:text-white"
                onClick={() => remove(t)}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <div className="relative">
        <Input
          value={q}
          placeholder={placeholder}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); add(matches[0] ?? query); }
          }}
        />
        {open ? (
          <div className="absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-neutral-200 bg-white shadow">
            {matches.map((m) => (
              <button
                key={m}
                type="button"
                className="block w-full px-3 py-2 text-left text-sm capitalize hover:bg-apb-cream"
                onMouseDown={(e) => { e.preventDefault(); add(m); }}
              >
                {m}
              </button>
            ))}
            {query && !exact ? (
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-sm font-medium text-apb hover:bg-apb-cream"
                onMouseDown={(e) => { e.preventDefault(); add(query); }}
              >
                + Add &ldquo;{query}&rdquo;
              </button>
            ) : null}
            {!matches.length && !query ? (
              <p className="px-3 py-2 text-sm text-neutral-400">Start typing to search…</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
