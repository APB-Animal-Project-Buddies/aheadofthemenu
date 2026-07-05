"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export function CreatorCombobox({
  value,
  onChange,
  options,
  placeholder = "e.g. Nora Cooks, Vegan Richa",
}: {
  value: string;
  onChange: (next: string) => void;
  options: readonly string[];
  placeholder?: string;
}) {
  const [q, setQ] = useState(value);
  const [open, setOpen] = useState(false);

  const query = q.trim();
  const lower = query.toLowerCase();
  const matches = options
    .filter((o) => lower === "" || o.toLowerCase().includes(lower))
    .slice(0, 8);

  const select = (item: string) => {
    onChange(item);
    setQ(item);
    setOpen(false);
  };

  return (
    <div className="relative">
      <Input
        value={q}
        placeholder={placeholder}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open ? (
        <div className="absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-neutral-200 bg-white shadow">
          {matches.map((m) => (
            <button
              key={m}
              type="button"
              className="block w-full px-3 py-2 text-left text-sm hover:bg-apb-cream"
              onMouseDown={(e) => { e.preventDefault(); select(m); }}
            >
              {m}
            </button>
          ))}
          {!matches.length && query ? (
            <p className="px-3 py-2 text-sm text-neutral-400">No creators found</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
