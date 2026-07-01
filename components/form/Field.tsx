import * as React from "react";
import { Label } from "@/components/ui/label";

/**
 * Reusable labeled field wrapper: label (+ required mark), optional hint,
 * the control (children supply their own top margin), and an optional error.
 */
export function Field({
  label,
  required,
  hint,
  error,
  className,
  children,
}: {
  label: React.ReactNode;
  required?: boolean;
  hint?: React.ReactNode;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label>
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </Label>
      {hint ? <p className="mt-1 text-xs text-neutral-500">{hint}</p> : null}
      {children}
      {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
