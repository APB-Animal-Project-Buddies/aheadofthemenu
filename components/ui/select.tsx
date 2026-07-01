import * as React from "react";
import { cn } from "@/lib/utils";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-apb",
        className
      )}
      {...props}
    />
  )
);
Select.displayName = "Select";

/** Render `<option>`s from a string list, formatting snake_case for display. */
export function Options({ values, placeholder }: { values: readonly string[]; placeholder?: string }) {
  return (
    <>
      {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
      {values.map((v) => (
        <option key={v} value={v}>
          {v.replace(/_/g, " ")}
        </option>
      ))}
    </>
  );
}
