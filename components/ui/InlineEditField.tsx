"use client";

/**
 * Click-to-edit field: read-only text with a hover-revealed "Edit" link that
 * swaps in an input/textarea + explicit Save/Cancel. Same shape as the handle
 * editor on app/profile/page.tsx (click → controlled input → async save),
 * generalized so creator-profile and account fields share one implementation
 * instead of three copies of the same state machine.
 */
import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

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
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!editing) {
    return (
      <div className="group flex items-start gap-2">
        <div className="min-w-0 flex-1 text-sm">
          {value ? (
            renderValue ? renderValue(value) : <span className="whitespace-pre-wrap text-neutral-800">{value}</span>
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
          className="shrink-0 text-xs font-medium text-apb opacity-0 transition group-hover:opacity-100 focus:opacity-100 hover:underline"
        >
          Edit
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
