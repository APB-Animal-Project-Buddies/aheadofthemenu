"use client";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";

type Hit = { id: string; name: string; vegan: boolean | null; allergens?: string[] };
export type IngredientValue = { id?: string; name: string; allergens?: string[] };

export function IngredientCombobox({ value, onChange }: { value: IngredientValue; onChange: (v: IngredientValue) => void }) {
  const [open, setOpen] = useState(false);
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const q = value.name.trim();
    if (q.length < 2) { setHits([]); return; }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/ingredients/search?q=${encodeURIComponent(q)}`);
        const json = await res.json();
        setHits(Array.isArray(json.results) ? json.results : []);
      } catch { setHits([]); } finally { setLoading(false); }
    }, 250);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [value.name]);

  async function addNew() {
    const name = value.name.trim();
    if (name.length < 2) return;
    try {
      const res = await fetch("/api/ingredients", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const json = await res.json();
      if (json.ingredient?.id) onChange({ id: json.ingredient.id, name: json.ingredient.name, allergens: json.ingredient.allergens ?? [] });
    } catch { /* keep free-text name */ }
    setOpen(false);
  }

  const exact = hits.some((h) => h.name.toLowerCase() === value.name.trim().toLowerCase());
  return (
    <div className="relative">
      <Input
        value={value.name}
        placeholder="Ingredient"
        onChange={(e) => { onChange({ name: e.target.value }); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && value.name.trim().length >= 2 ? (
        <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-neutral-200 bg-white shadow">
          {hits.map((h) => (
            <button type="button" key={h.id}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-apb-cream"
              onMouseDown={(e) => { e.preventDefault(); onChange({ id: h.id, name: h.name, allergens: h.allergens ?? [] }); setOpen(false); }}>
              {h.name}{h.vegan === false ? <span className="ml-2 text-xs text-red-600">non-vegan</span> : null}
            </button>
          ))}
          {!loading && !exact ? (
            <button type="button" className="block w-full px-3 py-2 text-left text-sm font-medium text-apb hover:bg-apb-cream"
              onMouseDown={(e) => { e.preventDefault(); void addNew(); }}>
              + Add &ldquo;{value.name.trim()}&rdquo;
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
