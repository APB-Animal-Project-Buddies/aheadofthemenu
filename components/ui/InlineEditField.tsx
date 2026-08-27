"use client";

/**
 * Click-to-edit field: read-only text with an always-visible edit (pencil)
 * button that swaps in an input/textarea + explicit Save/Cancel. Same shape as the handle
 * editor on app/profile/page.tsx (click → controlled input → async save),
 * generalized so creator-profile and account fields share one implementation
 * instead of three copies of the same state machine.
 */
import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

/** Long values (URLs especially) are clipped in read mode; the full value is in the title. */
export const DISPLAY_MAX = 30;
export function clip(value: string, max = DISPLAY_MAX): string {
  return value.length > max ? value.slice(0, max - 1) + "…" : value;
}

type Props = {
  label: string;
  value: string;
  /** Called with the trimmed draft on Save. Throw (or reject) with a message to show inline. */
  onSave: (next: string) => Promise<void>;
  placeholder?: string;
  multiline?: boolean;
  type?: "text" | "url";
  /** Shown in place of the value when it's empty and not being edited. */
  emptyText?: string;
  /** Return an error string to block saving, or null/undefined if the draft is valid. */
  validate?: (next: string) => string | null | undefined;
  /** Render the read-only value yourself (e.g. as a link) instead of plain text. */
  renderValue?: (value: string) => React.ReactNode;
  /** Mount already in edit mode (e.g. a field the user just chose to add). */
  startEditing?: boolean;
  /** Called when the user cancels (Esc / Cancel) — lets a parent hide a just-added field. */
  onCancel?: () => void;
};

export function InlineEditField({
  label,
  value,
  onSave,
  placeholder,
  multiline,
  type = "text",
  emptyText,
  validate,
  renderValue,
  startEditing = false,
  onCancel,
}: Props) {
  const [editing, setEditing] = useState(startEditing);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!editing) {
    return (
      <div className="group flex items-start gap-2">
        <div className="min-w-0 flex-1 text-sm">
          {value ? (
            renderValue ? (
              renderValue(value)
            ) : multiline ? (
              <span className="whitespace-pre-wrap text-neutral-800">{value}</span>
            ) : (
              <span className="text-neutral-800" title={value.length > DISPLAY_MAX ? value : undefined}>
                {clip(value)}
              </span>
            )
          ) : (
            <span className="italic text-neutral-400">{emptyText ?? `Add ${label.toLowerCase()}`}</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            setDraft(value);
            setError(null);
            setEditing(true);
          }}
          aria-label={`Edit ${label.toLowerCase()}`}
          title={`Edit ${label.toLowerCase()}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-apb/10 text-apb transition hover:bg-apb hover:text-white focus:outline-none focus:ring-2 focus:ring-apb/40"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
        </button>
      </div>
    );
  }

  const save = async () => {
    const trimmed = draft.trim();
    const validationError = validate?.(trimmed);
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(trimmed);
      setEditing(false);
      toast.success(`${label} updated`);
    } catch (e: any) {
      setError(e?.message || "Couldn't save — try again.");
    } finally {
      setSaving(false);
    }
  };

  const Field = multiline ? Textarea : Input;

  return (
    <div className="flex flex-col gap-1.5">
      <Field
        autoFocus
        type={multiline ? undefined : type}
        value={draft}
        placeholder={placeholder}
        disabled={saving}
        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(e.target.value)}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === "Enter" && !multiline) save();
          if (e.key === "Escape") {
            setEditing(false);
            setError(null);
            onCancel?.();
          }
        }}
      />
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <div className="flex items-center gap-3">
        <Button type="button" onClick={save} disabled={saving} className="rounded-lg px-3 py-1.5 text-xs">
          {saving ? "Saving…" : "Save"}
        </Button>
        <button
          type="button"
          onClick={() => {
            setEditing(false);
            setError(null);
            onCancel?.();
          }}
          disabled={saving}
          className="text-xs text-neutral-500 hover:underline disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
