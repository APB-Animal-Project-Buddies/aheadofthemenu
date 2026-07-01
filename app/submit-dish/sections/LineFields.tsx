"use client";
import { useFormContext, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Select, Options } from "@/components/ui/select";
import { IngredientCombobox } from "@/components/ui/IngredientCombobox";
import { UNITS } from "@/lib/dishes";
import type { RecipeFormValues } from "../types";

/**
 * The name (combobox) + quantity + unit trio for one ingredient line.
 * `namePrefix` is the react-hook-form path to the line object, e.g.
 *   "ingredientGroups.0.items.2"  or  "...items.2.alternatives.1.items.0".
 *
 * Mirrors the original single-row behavior: only the name + id are touched on a
 * combobox change (id via setValue), never re-mounting the row — otherwise the
 * registered Qty/unit inputs would be wiped. id is set on a pool pick and cleared
 * (undefined) on free-text edits, so it never desyncs.
 */
export function LineFields({
  namePrefix,
  onPickAllergens,
}: {
  namePrefix: string;
  // called when an ingredient is picked from the pool, with its allergens —
  // used by top-level rows to auto-add them to the recipe's allergen list.
  onPickAllergens?: (allergens: string[]) => void;
}) {
  const { control, register, setValue } = useFormContext<RecipeFormValues>();
  return (
    <>
      <div className="flex-1">
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
      <Input
        className="w-20"
        type="number"
        step="any"
        min="0"
        placeholder="Qty"
        aria-label="Quantity"
        {...register(`${namePrefix}.quantity` as any)}
      />
      <Select className="w-28" aria-label="Unit" {...register(`${namePrefix}.unit` as any)}>
        <Options values={UNITS} placeholder="unit" />
      </Select>
    </>
  );
}
