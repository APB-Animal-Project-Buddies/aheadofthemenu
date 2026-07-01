import * as React from "react";
import { cn } from "@/lib/utils";
export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => (
    <button ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-[16px] bg-apb px-6 py-3 text-base font-semibold text-white",
        "transition hover:bg-apb-light disabled:opacity-60", className)}
      {...props} />
  )
);
Button.displayName = "Button";
