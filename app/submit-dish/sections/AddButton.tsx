"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Shared "add" affordance for the ingredients editor, with a prominence scale:
 *   primary — full-width, most prominent (Add section)
 *   default — boxed dashed button (Add ingredient)
 *   subtle  — smaller, lighter (Add alternative / add line)
 * All render a leading "+" so the action reads at a glance.
 */
export function AddButton({
  children,
  onClick,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "primary" | "default" | "subtle";
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg border border-dashed font-semibold transition",
        variant === "primary" &&
          "w-full border-apb px-4 py-2.5 text-sm text-apb hover:bg-apb hover:text-white",
        variant === "default" &&
          "border-apb px-3.5 py-2 text-sm text-apb hover:bg-apb-cream",
        variant === "subtle" &&
          "border-neutral-300 px-2.5 py-1.5 text-xs text-neutral-600 hover:border-apb hover:text-apb",
        className
      )}
    >
      <span aria-hidden className="text-base leading-none">+</span>
      {children}
    </button>
  );
}
