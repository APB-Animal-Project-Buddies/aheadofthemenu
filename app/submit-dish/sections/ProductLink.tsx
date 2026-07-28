import { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { AddButton } from "./AddButton";

interface ProductOption {
  id: string;
  product_name: string;
  purchase_link: string;
  ingredient_id: string;
}

// Optional purchasable-product link for an ingredient — additive metadata: the
// ingredient stays a normal ingredient and gains a "→ product ↗" reference on the
// dish page. Products belong to a generic ingredient, so linking needs the row's
// canonical ingredient id; if the ingredient was free-typed we mint one via
// /api/ingredients first. Rendered as one trailing cell of the ingredient row.
export function ProductLink({ namePrefix }: { namePrefix: string }) {
  const { watch, setValue } = useFormContext();
  const productId = watch(`${namePrefix}.productId` as any);
  const ingredientId = watch(`${namePrefix}.id` as any);
  const ingredientName = watch(`${namePrefix}.name` as any);

  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [linked, setLinked] = useState<ProductOption | null>(null);

  // add-new form
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newLink, setNewLink] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Resolve the linked product's display name (edit mode gives us only the id).
  useEffect(() => {
    if (!productId) { setLinked(null); return; }
    if (linked?.id === productId) return;
    let cancelled = false;
    (async () => {
      try {
        const params = new URLSearchParams();
        if (ingredientId) params.append("ingredientId", String(ingredientId));
        const res = await fetch(`/api/products?${params.toString()}`);
        const data = await res.json();
        const found = (data.products || []).find((p: ProductOption) => p.id === productId);
        if (!cancelled && found) setLinked(found);
      } catch { /* leave name unresolved; chip falls back to generic label */ }
    })();
    return () => { cancelled = true; };
  }, [productId, ingredientId]);

  const fetchProducts = async (term: string) => {
    if (!ingredientId) { setProducts([]); return; }
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("ingredientId", String(ingredientId));
      if (term.trim()) params.append("search", term);
      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      setProducts(data.products || []);
    } catch { setProducts([]); }
    setLoading(false);
  };

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => fetchProducts(search), 400);
    return () => clearTimeout(t);
  }, [search, open, ingredientId]);

  const selectProduct = (p: ProductOption) => {
    setValue(`${namePrefix}.productId` as any, p.id, { shouldDirty: true });
    setLinked(p);
    setOpen(false);
    setAdding(false);
  };

  const unlink = () => {
    setValue(`${namePrefix}.productId` as any, undefined, { shouldDirty: true });
    setLinked(null);
  };

  // Products require a generic ingredient. Reuse the row's canonical id, or mint one
  // from the typed ingredient name (same custom:<slug> flow the combobox uses).
  const ensureIngredientId = async (): Promise<string | null> => {
    if (ingredientId) return String(ingredientId);
    const name = String(ingredientName ?? "").trim();
    if (!name) return null;
    const res = await fetch(`/api/ingredients`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    const id = data?.ingredient?.id;
    if (id) { setValue(`${namePrefix}.id` as any, id, { shouldDirty: true }); return id; }
    return null;
  };

  const addProduct = async () => {
    setError(null);
    if (!newName.trim()) { setError("Product name is required."); return; }
    if (!newLink.trim()) { setError("Purchase link is required."); return; }
    setSaving(true);
    try {
      const ing = await ensureIngredientId();
      if (!ing) { setError("Name the ingredient first."); setSaving(false); return; }
      const res = await fetch(`/api/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_name: newName.trim(), purchase_link: newLink.trim(), ingredient_id: ing }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data?.error || "Could not add product."); setSaving(false); return; }
      selectProduct(data.product);
      setNewName(""); setNewLink("");
    } catch {
      setError("Could not add product.");
    }
    setSaving(false);
  };

  // Linked: compact chip with unlink.
  if (productId) {
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap rounded border border-emerald-300 bg-emerald-50 px-2 py-1.5 text-xs text-emerald-700">
        <span aria-hidden>🛒</span>
        <span className="max-w-[10rem] truncate">{linked?.product_name ?? "product linked"}</span>
        <button
          type="button"
          aria-label="Unlink product"
          onClick={unlink}
          className="ml-0.5 text-emerald-600 hover:text-red-600"
        >
          ✕
        </button>
      </span>
    );
  }

  const noIngredient = !ingredientId && !String(ingredientName ?? "").trim();

  return (
    <div className="relative">
      <AddButton variant="subtle" onClick={() => setOpen((v) => !v)}>
        link product
      </AddButton>

      {open ? (
        <div className="absolute right-0 top-full z-20 mt-1 max-h-96 w-80 overflow-auto rounded-lg border border-neutral-200 bg-white shadow-lg">
          <div className="sticky top-0 flex items-center justify-between border-b border-neutral-200 bg-white p-3">
            <h3 className="m-0 text-sm font-semibold text-neutral-900">Link a product</h3>
            <button
              type="button"
              onClick={() => { setOpen(false); setAdding(false); }}
              className="text-xl leading-none text-neutral-500 hover:text-neutral-800"
            >
              ✕
            </button>
          </div>

          {noIngredient ? (
            <div className="p-4 text-xs text-neutral-500">
              Name the ingredient first, then link a product to it.
            </div>
          ) : (
            <>
              <div className="border-b border-neutral-200 p-3">
                <Input
                  type="text"
                  placeholder="Search products…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full"
                />
              </div>

              {loading ? (
                <div className="p-4 text-center text-xs text-neutral-500">Loading…</div>
              ) : products.length ? (
                <div className="flex flex-col">
                  {products.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => selectProduct(p)}
                      className="border-b border-neutral-100 px-3 py-2 text-left text-sm text-neutral-900 hover:bg-neutral-50"
                    >
                      {p.product_name}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-neutral-500">
                  No products yet for this ingredient.
                </div>
              )}

              {adding ? (
                <div className="border-t border-neutral-200 p-3">
                  <Input
                    type="text"
                    placeholder="Product name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="mb-2 w-full"
                  />
                  <Input
                    type="text"
                    placeholder="Purchase link (https://…)"
                    value={newLink}
                    onChange={(e) => setNewLink(e.target.value)}
                    className="mb-2 w-full"
                  />
                  {error ? <p className="mb-2 text-xs text-red-600">{error}</p> : null}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={addProduct}
                      className="rounded bg-apb px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      {saving ? "Adding…" : "Add product"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAdding(false); setError(null); }}
                      className="px-3 py-1.5 text-xs text-neutral-500"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-t border-neutral-200 p-3">
                  <AddButton variant="subtle" onClick={() => setAdding(true)}>
                    add a new product
                  </AddButton>
                </div>
              )}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
