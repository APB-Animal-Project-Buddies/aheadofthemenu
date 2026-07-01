"use client";
import { useFieldArray, useFormContext } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { RecipeFormValues } from "../types";

export function StepsSection() {
  const { control, register, watch } = useFormContext<RecipeFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: "steps" });
  const hasLink = (watch("resourceLink") ?? "").trim().length > 0;

  return (
    <div>
      <Label>
        Steps <span className="font-normal text-neutral-400">(optional)</span>
      </Label>
      {hasLink ? (
        <p className="mt-1 text-xs text-neutral-500">
          You added a recipe link above — you can skip the steps below.
        </p>
      ) : null}
      <div className="mt-2 flex flex-col gap-2">
        {fields.map((f, i) => (
          <div key={f.id} className="flex items-start gap-2">
            <span className="mt-2 w-6 shrink-0 text-sm font-medium text-apb">{i + 1}.</span>
            <Textarea rows={2} className="flex-1" placeholder={`Step ${i + 1}`} {...register(`steps.${i}.text`)} />
            <button
              type="button"
              aria-label="Remove step"
              className="px-2 py-2 text-neutral-400 hover:text-red-600"
              onClick={() => remove(i)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="mt-2 text-sm font-medium text-apb"
        onClick={() => append({ text: "" })}
      >
        + Add step
      </button>
    </div>
  );
}
