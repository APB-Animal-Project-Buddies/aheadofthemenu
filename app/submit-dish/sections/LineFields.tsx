import { useState, useEffect } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Select, Options } from "@/components/ui/select";
import { IngredientCombobox } from "@/components/ui/IngredientCombobox";
import { AddButton } from "./AddButton";
import { UNITS, isValidQuantity } from "@/lib/dishes";
import { cn } from "@/lib/utils";
import type { RecipeFormValues } from "../types";

interface LineFieldsProps {
  namePrefix: string; // form path, e.g. "ingredientGroups.0.items.0"
  onPickAllergens?: (allergens: string[]) => void;
}

interface DishOption {
  id: number;
  dish_name: string;
  creator?: string | null;
}

// Who to credit for a dish in the picker: the "Original creator" field, else the
// account name of whoever submitted it (no per-dish handle is exposed here).
function dishCreator(d: any): string | null {
  return d?.dish_data?.originalCreator || d?.dish_data?.submittedBy?.name || null;
}

// One ingredient row. Renders flex CELLS (name / qty / unit / actions) — the parent
// wraps each row in `flex items-start gap-2` and owns the row-remove button. A row can
// either be a plain ingredient (name via IngredientCombobox) OR a link to another dish
// used as an ingredient ("nested recipe"), toggled via the "link recipe" picker.
export function LineFields({ namePrefix, onPickAllergens }: LineFieldsProps) {
  const { control, register, setValue, watch, getFieldState, formState } =
    useFormContext<RecipeFormValues>();

  // Nested-recipe picker state.
  const [showRecipePicker, setShowRecipePicker] = useState(false);
  const [dishes, setDishes] = useState<DishOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const nestedDishId = watch(`${namePrefix}.nestedDishId` as any);
  const ingredientName = watch(`${namePrefix}.name` as any);
  const linkedDishName =
    nestedDishId && dishes.length > 0
      ? dishes.find((d) => d.id === nestedDishId)?.dish_name ?? ingredientName
      : ingredientName;

  const qtyName = `${namePrefix}.quantity`;
  // Field-level error so the offending quantity is flagged in place (RHF's
  // shouldFocusError auto-scrolls to it on submit), alongside the bottom summary.
  const qtyError = getFieldState(qtyName as any, formState).error?.message as string | undefined;

  // Server-side dish search for the picker; refetched (debounced 500ms) as the query
  // changes while the picker is open, so we never fetch for closed rows on mount.
  const fetchDishes = async (searchTerm = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("limit", "50");
      if (searchTerm.trim()) params.append("search", searchTerm);
      const res = await fetch(`/api/dishes?${params.toString()}`);
      const data = await res.json();
      setDishes(
        (data.dishes || []).map((d: any) => ({
          id: d.id,
          dish_name: d.dish_name,
          creator: dishCreator(d),
        }))
      );
    } catch (error) {
      console.error("Failed to fetch dishes:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!showRecipePicker) return;
    const timer = setTimeout(() => fetchDishes(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery, showRecipePicker]);

  const handleSelectRecipe = (dishId: number, dishName: string) => {
    setValue(`${namePrefix}.nestedDishId` as any, dishId, { shouldDirty: true });
    setValue(`${namePrefix}.name` as any, dishName, { shouldDirty: true });
    setShowRecipePicker(false);
  };

  const handleUnlink = () => {
    setValue(`${namePrefix}.nestedDishId` as any, undefined, { shouldDirty: true });
    setValue(`${namePrefix}.name` as any, "", { shouldDirty: true });
    setDishes([]);
    setSearchQuery("");
  };

  // Fraction-aware quantity + unit — shared by the plain and linked row layouts.
  const qtyAndUnit = (
    <>
      <div className="w-20">
        <Input
          className={cn("w-full", qtyError && "border-red-400 focus:border-red-500")}
          type="text"
          inputMode="text"
          autoComplete="off"
          placeholder="Qty"
          aria-label="Quantity"
          aria-invalid={qtyError ? true : undefined}
          {...register(qtyName as any, {
            validate: (v: string) => isValidQuantity(v ?? "") || "Number or fraction only",
          })}
        />
        {qtyError ? <p className="mt-1 text-xs text-red-600">{qtyError}</p> : null}
      </div>
      <Select className="w-28" aria-label="Unit" {...register(`${namePrefix}.unit` as any)}>
        <Options values={UNITS} placeholder="unit" />
      </Select>
    </>
  );

  // Linked nested recipe: name pill + qty/unit + unlink.
  if (nestedDishId) {
    return (
      <>
        <div className="flex flex-1 items-center gap-2 rounded border border-orange-600 bg-blue-50 px-3 py-2">
          <span className="text-sm font-medium text-neutral-600">Linked:</span>
          <span className="flex-1 text-base font-semibold text-orange-600">
            {linkedDishName || `Recipe #${nestedDishId}`}
          </span>
        </div>
        {qtyAndUnit}
        <button
          type="button"
          aria-label="Unlink recipe"
          className="whitespace-nowrap px-2 py-2 text-xs font-medium text-neutral-500 hover:text-red-600"
          onClick={handleUnlink}
        >
          unlink recipe
        </button>
      </>
    );
  }

  // Plain ingredient row (combobox name + qty/unit) with a "link recipe" affordance.
  // The picker popover is absolutely positioned within the relative name cell.
  return (
    <>
      <div className="relative flex-1">
        <Controller
          control={control}
          name={`${namePrefix}.name` as any}
          render={({ field }) => (
            <IngredientCombobox
              value={{ name: field.value ?? "" }}
              onChange={(val) => {
                field.onChange(val.name);
                setValue(`${namePrefix}.id` as any, val.id, { shouldDirty: true });
                if (onPickAllergens && val.allergens?.length) onPickAllergens(val.allergens);
              }}
            />
          )}
        />

        {showRecipePicker ? (
          <div className="absolute left-0 top-full z-20 mt-1 max-h-80 w-full min-w-[22rem] overflow-auto rounded-lg border border-neutral-200 bg-white shadow-lg">
            <div className="sticky top-0 flex items-center justify-between border-b border-neutral-200 bg-white p-4">
              <h3 className="m-0 text-base font-semibold text-neutral-900">Link a Recipe</h3>
              <button
                type="button"
                onClick={() => {
                  setShowRecipePicker(false);
                  setSearchQuery("");
                }}
                className="cursor-pointer border-none bg-none p-0 text-2xl text-neutral-600"
              >
                ✕
              </button>
            </div>

            <div className="border-b border-neutral-200 bg-white px-4 py-3">
              <Input
                type="text"
                placeholder="Search recipes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>

            {loading ? (
              <div className="p-8 text-center text-neutral-600">Loading recipes...</div>
            ) : dishes.length === 0 ? (
              <div className="p-8 text-center text-neutral-600">
                {searchQuery.trim() ? "No recipes match your search" : "No dishes available yet"}
              </div>
            ) : (
              <div className="flex flex-col">
                {dishes.map((dish) => (
                  <button
                    key={dish.id}
                    type="button"
                    onClick={() => handleSelectRecipe(dish.id, dish.dish_name)}
                    className="cursor-pointer border-b border-neutral-100 bg-white px-4 py-3 text-left hover:bg-neutral-50"
                  >
                    <div className="text-sm text-neutral-900">{dish.dish_name}</div>
                    {dish.creator ? (
                      <div className="text-xs text-neutral-500">by {dish.creator}</div>
                    ) : null}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>

      {qtyAndUnit}

      <AddButton variant="subtle" onClick={() => setShowRecipePicker(true)}>
        link recipe
      </AddButton>
    </>
  );
}
