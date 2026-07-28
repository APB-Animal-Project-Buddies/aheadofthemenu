"use client";

/**
 * Two-step add-a-dish modal.
 *  Where? — searchable picker over the loaded restaurants, or "+ New
 *           restaurant" inline fields (name*, address*, neighborhood, website).
 *  What?  — dish name*, one-line description, tag chips (existing vocabulary
 *           + free text). A live duplicate check against the loaded catalog
 *           steers people to vote instead of re-adding.
 * Submits POST /api/eat-this/dishes with the caller's Bearer token;
 * an idempotent `existed: true` response counts as success and jumps to the
 * existing card. A 401 (expired session) shows a sign-in prompt.
 */
import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/AuthProvider";
import type { CatalogRestaurant } from "./RestaurantCard";
import type { CatalogDish } from "./DishCard";

type NewRestaurantFields = { name: string; address: string; neighborhood: string; website: string };
const EMPTY_NEW: NewRestaurantFields = { name: "", address: "", neighborhood: "", website: "" };

export function AddDishModal({ open, onClose, restaurants, dishes, initialRestaurantId, onAdded, onJumpToDish }: {
  open: boolean;
  onClose: () => void;
  restaurants: CatalogRestaurant[];
  dishes: CatalogDish[];
  initialRestaurantId?: string | null;
  /** Called with the new dish id on success — the page refetches + scrolls + highlights. */
  onAdded: (dishId: string) => void;
  /** Jump to an already-listed dish instead of re-adding it. */
  onJumpToDish: (dishId: string) => void;
}) {
  const { session } = useAuth();

  const [step, setStep] = useState<"where" | "what">("where");
  const [restaurantQuery, setRestaurantQuery] = useState("");
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [newRestaurant, setNewRestaurant] = useState<NewRestaurantFields>(EMPTY_NEW);

  const [dishName, setDishName] = useState("");
  const [description, setDescription] = useState("");
  const [availability, setAvailability] = useState<"permanent" | "seasonal">("permanent");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [customizations, setCustomizations] = useState<string[]>([]);
  const [customizationInput, setCustomizationInput] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  // Fresh form every time the modal opens (optionally pre-selected to a venue).
  useEffect(() => {
    if (!open) return;
    setStep("where");
    setRestaurantQuery("");
    setRestaurantId(initialRestaurantId ?? null);
    setCreatingNew(false);
    setNewRestaurant(EMPTY_NEW);
    setDishName("");
    setDescription("");
    setAvailability("permanent");
    setTags([]);
    setTagInput("");
    setCustomizations([]);
    setCustomizationInput("");
    setSubmitting(false);
    setError(null);
    setSessionExpired(false);
  }, [open, initialRestaurantId]);

  const filteredRestaurants = useMemo(() => {
    const q = restaurantQuery.trim().toLowerCase();
    if (!q) return restaurants;
    return restaurants.filter((r) =>
      r.name.toLowerCase().includes(q) ||
      r.locations.some((l) => (l.neighborhood ?? "").toLowerCase().includes(q))
    );
  }, [restaurants, restaurantQuery]);

  /** Existing tag vocabulary across the loaded catalog. */
  const tagVocabulary = useMemo(() => {
    const seen = new Set<string>();
    for (const d of dishes) for (const t of d.tags) seen.add(t);
    for (const t of tags) seen.add(t); // keep free-text additions visible as chips
    return Array.from(seen).sort();
  }, [dishes, tags]);

  const selectedRestaurant = restaurants.find((r) => r.id === restaurantId) ?? null;

  /** Live duplicate check against the loaded catalog for the chosen restaurant. */
  const duplicate = useMemo(() => {
    if (creatingNew || !restaurantId) return null;
    const name = dishName.trim().toLowerCase();
    if (!name) return null;
    return dishes.find((d) => d.restaurantId === restaurantId && d.name.trim().toLowerCase() === name) ?? null;
  }, [creatingNew, restaurantId, dishName, dishes]);

  const whereReady = creatingNew
    ? newRestaurant.name.trim() !== "" && newRestaurant.address.trim() !== ""
    : restaurantId !== null;
  const canSubmit = dishName.trim() !== "" && !duplicate && !submitting;

  const toggleTag = (tag: string) =>
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));

  const addFreeTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput("");
  };

  /** Existing customization vocabulary across the loaded catalog (tofu, seitan…). */
  const customizationVocabulary = useMemo(() => {
    const seen = new Set<string>();
    for (const d of dishes) for (const c of d.customizations ?? []) seen.add(c);
    for (const c of customizations) seen.add(c);
    return Array.from(seen).sort();
  }, [dishes, customizations]);

  const toggleCustomization = (c: string) =>
    setCustomizations((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const addFreeCustomization = () => {
    const c = customizationInput.trim().toLowerCase();
    if (c && !customizations.includes(c)) setCustomizations((prev) => [...prev, c]);
    setCustomizationInput("");
  };

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    setSessionExpired(false);
    try {
      const res = await fetch("/api/eat-this/dishes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken ?? ""}`,
        },
        body: JSON.stringify({
          restaurantId: creatingNew ? null : restaurantId,
          newRestaurant: creatingNew
            ? {
                name: newRestaurant.name.trim(),
                address: newRestaurant.address.trim(),
                neighborhood: newRestaurant.neighborhood.trim() || null,
                website: newRestaurant.website.trim() || null,
              }
            : null,
          name: dishName.trim(),
          description: description.trim() || null,
          availability,
          tags,
          customizations,
        }),
      });
      if (res.status === 401) {
        setSessionExpired(true);
        return;
      }
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body?.error ?? "Couldn't add the dish right now");
        return;
      }
      // existed: true is still success — jump to the already-listed card.
      if (body.existed && body.dishId) {
        onJumpToDish(body.dishId);
        onClose();
        return;
      }
      if (body.dishId) onAdded(body.dishId);
      onClose();
    } catch {
      setError("Couldn't add the dish right now");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={step === "where" ? "Add a dish — where?" : "Add a dish — what?"}>
      {step === "where" ? (
        <div className="flex flex-col gap-3">
          {!creatingNew && (
            <>
              <Input
                autoFocus
                placeholder="Search restaurants by name or neighborhood…"
                value={restaurantQuery}
                onChange={(e) => setRestaurantQuery(e.target.value)}
              />
              <div className="max-h-56 overflow-y-auto rounded-lg border border-neutral-200">
                {filteredRestaurants.map((r) => (
                  <label
                    key={r.id}
                    className={`flex cursor-pointer items-center gap-2.5 border-b border-neutral-100 px-3 py-2 last:border-b-0 ${
                      restaurantId === r.id ? "bg-apb/5" : "hover:bg-neutral-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="rl-restaurant"
                      checked={restaurantId === r.id}
                      onChange={() => setRestaurantId(r.id)}
                      className="accent-apb"
                    />
                    <span className="text-sm font-medium text-neutral-800">{r.name}</span>
                    {r.locations[0]?.neighborhood && (
                      <span className="text-xs text-neutral-400">· {r.locations[0].neighborhood}</span>
                    )}
                  </label>
                ))}
                {filteredRestaurants.length === 0 && (
                  <div className="px-3 py-4 text-center text-xs text-neutral-500">
                    No matching restaurants — add a new one below.
                  </div>
                )}
              </div>
            </>
          )}

          <button
            type="button"
            onClick={() => setCreatingNew((v) => !v)}
            className="self-start text-sm font-semibold text-apb hover:underline"
          >
            {creatingNew ? "← Pick an existing restaurant" : "+ New restaurant"}
          </button>

          {creatingNew && (
            <div className="flex flex-col gap-2">
              <Input placeholder="Restaurant name *" value={newRestaurant.name}
                onChange={(e) => setNewRestaurant({ ...newRestaurant, name: e.target.value })} />
              <Input placeholder="Street address *" value={newRestaurant.address}
                onChange={(e) => setNewRestaurant({ ...newRestaurant, address: e.target.value })} />
              <Input placeholder="Neighborhood" value={newRestaurant.neighborhood}
                onChange={(e) => setNewRestaurant({ ...newRestaurant, neighborhood: e.target.value })} />
              <Input placeholder="Website" value={newRestaurant.website}
                onChange={(e) => setNewRestaurant({ ...newRestaurant, website: e.target.value })} />
            </div>
          )}

          <button
            type="button"
            disabled={!whereReady}
            onClick={() => setStep("what")}
            className="mt-1 rounded-lg bg-apb px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
          >
            Continue
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="text-xs text-neutral-500">
            at <strong className="text-neutral-700">{creatingNew ? newRestaurant.name : selectedRestaurant?.name}</strong>{" "}
            <button type="button" className="text-apb hover:underline" onClick={() => setStep("where")}>change</button>
          </div>

          <Input autoFocus placeholder="Dish name *" value={dishName} onChange={(e) => setDishName(e.target.value)} />

          {duplicate && (
            <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Already listed at this restaurant —{" "}
              <button
                type="button"
                className="font-semibold underline"
                onClick={() => { onJumpToDish(duplicate.id); onClose(); }}
              >
                vote it up instead
              </button>
            </div>
          )}

          <Input placeholder="One-line description" value={description} onChange={(e) => setDescription(e.target.value)} />

          <div>
            <div className="mb-1.5 text-[10px] font-bold tracking-wide text-neutral-400">AVAILABILITY</div>
            <div className="flex gap-2">
              {(["permanent", "seasonal"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setAvailability(v)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition ${
                    availability === v
                      ? "border-apb bg-apb text-white"
                      : "border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-50"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-1.5 text-[10px] font-bold tracking-wide text-neutral-400">TAGS</div>
            <div className="flex flex-wrap gap-1.5">
              {tagVocabulary.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium capitalize transition ${
                    tags.includes(tag)
                      ? "border-apb bg-apb text-white"
                      : "border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-50"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <Input
                placeholder="Add a tag…"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); addFreeTag(); }
                }}
              />
              <button
                type="button"
                onClick={addFreeTag}
                disabled={!tagInput.trim()}
                className="shrink-0 rounded-lg border border-neutral-300 px-3 text-sm font-semibold text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-40"
              >
                Add
              </button>
            </div>
          </div>

          <div>
            <div className="mb-1 text-[10px] font-bold tracking-wide text-neutral-400">CUSTOMIZATIONS (OPTIONAL)</div>
            <p className="mb-1.5 text-[11px] text-neutral-400">Options diners can pick when they rate — e.g. tofu, seitan, cabbage.</p>
            <div className="flex flex-wrap gap-1.5">
              {customizationVocabulary.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleCustomization(c)}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium capitalize transition ${
                    customizations.includes(c)
                      ? "border-apb bg-apb text-white"
                      : "border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-50"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <Input
                placeholder="Add a customization…"
                value={customizationInput}
                onChange={(e) => setCustomizationInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addFreeCustomization(); } }}
              />
              <button
                type="button"
                onClick={addFreeCustomization}
                disabled={!customizationInput.trim()}
                className="shrink-0 rounded-lg border border-neutral-300 px-3 text-sm font-semibold text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-40"
              >
                Add
              </button>
            </div>
          </div>

          {sessionExpired && (
            <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Session expired —{" "}
              <a className="font-semibold underline" href="/login?next=/eat-this">sign in again</a> to add your dish.
            </div>
          )}
          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}

          <button
            type="button"
            disabled={!canSubmit}
            onClick={submit}
            className="rounded-lg bg-apb px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? "Adding…" : "Add dish"}
          </button>
        </div>
      )}
    </Modal>
  );
}
