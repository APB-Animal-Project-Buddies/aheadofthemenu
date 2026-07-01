import * as React from "react";
import { cn } from "@/lib/utils";
export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} rows={4}
      className={cn("w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-apb", className)}
      {...props} />
  )
);
Textarea.displayName = "Textarea";
