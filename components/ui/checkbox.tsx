"use client";
import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { cn } from "@/lib/utils";
export const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root ref={ref}
    className={cn("h-5 w-5 rounded border border-neutral-400 data-[state=checked]:bg-apb data-[state=checked]:border-apb", className)} {...props}>
    <CheckboxPrimitive.Indicator className="flex items-center justify-center text-white text-xs">✓</CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = "Checkbox";
