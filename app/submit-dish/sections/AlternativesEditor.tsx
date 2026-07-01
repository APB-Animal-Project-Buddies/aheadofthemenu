"use client";
import { useFieldArray, useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LineFields } from "./LineFields";
import { AddButton } from "./AddButton";
import { emptyAlternative, emptyLine, type RecipeFormValues } from "../types";

/**
 * Edits one ingredient row's `alternatives`. Kept visually secondary (indented,
 * lighter) so the main ingredient list stays scannable. Each alternative is a
 * labeled group of one-or-more replacement lines plus a free-text note.
 *
 * `namePrefix` is the path to the parent ingredient, e.g. "ingredientGroups.0.items.2".
 */
export function AlternativesEditor({ namePrefix }: { namePrefix: string }) {
  const { control } = useFormContext<RecipeFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: `${namePrefix}.alternatives` as any });

  return (
    <div className="ml-6 mt-1 flex flex-col gap-2">
      {fields.map((f, a) => (
        <AlternativeBlock
          key={f.id}
          namePrefix={`${namePrefix}.alternatives.${a}`}
          onRemove={() => remove(a)}
        />
      ))}
      <AddButton variant="subtle" className="self-start" onClick={() => append(emptyAlternative())}>
        alternative
      </AddButton>
    </div>
  );
}

/** One alternative: label, its replacement lines, and a note. */
function AlternativeBlock({ namePrefix, onRemove }: { namePrefix: string; onRemove: () => void }) {
  const { control, register } = useFormContext<RecipeFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: `${namePrefix}.items` as any });

  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50/60 p-2">
      <div className="flex items-center gap-2">
        <Input
          className="h-8 flex-1 text-xs"
          placeholder="Alternative label (optional) — e.g. Flax egg, Gluten-free"
          aria-label="Alternative label"
          {...register(`${namePrefix}.label` as any)}
        />
        <button
          type="button"
          aria-label="Remove alternative"
          className="px-2 text-neutral-400 hover:text-red-600"
          onClick={onRemove}
        >
          ×
        </button>
      </div>

      <div className="mt-2 flex flex-col gap-2">
        {fields.map((f, l) => (
          <div key={f.id} className="flex items-start gap-2">
            <LineFields namePrefix={`${namePrefix}.items.${l}`} />
            <button
              type="button"
              aria-label="Remove line"
              className="px-2 py-2 text-neutral-400 hover:text-red-600"
              onClick={() => remove(l)}
              // keep at least one line in an alternative
              disabled={fields.length <= 1}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="mt-2 flex items-center gap-3">
        <AddButton variant="subtle" onClick={() => append(emptyLine())}>
          add line
        </AddButton>
      </div>

      <Textarea
        className="mt-2 text-xs"
        rows={2}
        placeholder="Note (why / how to swap) — e.g. roast first, firmer bite · not gluten-free"
        aria-label="Alternative note"
        {...register(`${namePrefix}.note` as any)}
      />
    </div>
  );
}
