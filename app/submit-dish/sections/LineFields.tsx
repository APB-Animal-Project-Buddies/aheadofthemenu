import { Controller, useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Select, Options } from "@/components/ui/select";
import { IngredientCombobox } from "@/components/ui/IngredientCombobox";
import { ProductLink } from "./ProductLink";
import { UNITS, isValidQuantity } from "@/lib/dishes";
import { cn } from "@/lib/utils";
import type { DishFormValues } from "../types";

interface LineFieldsProps {
  namePrefix: string; // form path, e.g. "ingredientGroups.0.items.0"
  onPickAllergens?: (allergens: string[]) => void;
}

// One ingredient row. Renders flex CELLS (name / qty / unit / actions) — the parent
// wraps each row in `flex items-start gap-2` and owns the row-remove button. Each row
// is a plain ingredient (name via IngredientCombobox) that can optionally link a
// purchasable product (ProductLink). Rows edited from an older dish may still carry a
// nested-recipe link; we keep showing/unlinking those, but no longer create new ones.
export function LineFields({ namePrefix, onPickAllergens }: LineFieldsProps) {
  const { control, register, setValue, watch, getFieldState, formState } =
    useFormContext<DishFormValues>();

  const nestedDishId = watch(`${namePrefix}.nestedDishId` as any);
  const ingredientName = watch(`${namePrefix}.name` as any);

  const qtyName = `${namePrefix}.quantity`;
  // Field-level error so the offending quantity is flagged in place (RHF's
  // shouldFocusError auto-scrolls to it on submit), alongside the bottom summary.
  const qtyError = getFieldState(qtyName as any, formState).error?.message as string | undefined;

  const handleUnlinkRecipe = () => {
    setValue(`${namePrefix}.nestedDishId` as any, undefined, { shouldDirty: true });
    setValue(`${namePrefix}.name` as any, "", { shouldDirty: true });
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

  // Pre-existing nested-recipe link (from editing an older dish): show it and allow
  // unlinking. New nested links are no longer created from this form.
  if (nestedDishId) {
    return (
      <>
        <div className="flex flex-1 items-center gap-2 rounded border border-orange-600 bg-blue-50 px-3 py-2">
          <span className="text-sm font-medium text-neutral-600">Linked recipe:</span>
          <span className="flex-1 text-base font-semibold text-orange-600">
            {ingredientName || `Recipe #${nestedDishId}`}
          </span>
        </div>
        {qtyAndUnit}
        <button
          type="button"
          aria-label="Unlink recipe"
          className="whitespace-nowrap px-2 py-2 text-xs font-medium text-neutral-500 hover:text-red-600"
          onClick={handleUnlinkRecipe}
        >
          unlink recipe
        </button>
      </>
    );
  }

  // Plain ingredient row: combobox name + qty/unit + optional product link.
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
      </div>

      {qtyAndUnit}

      <ProductLink namePrefix={namePrefix} />
    </>
  );
}
