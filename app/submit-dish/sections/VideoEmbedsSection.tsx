"use client";

/**
 * Recipe intake — "Video links" section. Paste a YouTube or full TikTok video
 * URL; it's parsed + validated client-side, listed as a removable chip, and the
 * normalized { platform, id, url } array rides in the form's `videoEmbeds` value
 * (so it prefills on edit and flows through submit like any other recipe field).
 */
import { useState } from "react";
import { useFormContext, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/form/Field";
import { parseVideoUrl, MAX_VIDEO_EMBEDS, type VideoEmbed } from "@/lib/video-embeds";
import type { RecipeFormValues } from "../types";

export function VideoEmbedsSection() {
  const { control } = useFormContext<RecipeFormValues>();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <Controller
      control={control}
      name="videoEmbeds"
      render={({ field }) => {
        const embeds: VideoEmbed[] = field.value ?? [];
        const add = () => {
          const parsed = parseVideoUrl(draft);
          if (!parsed) {
            setError("Paste a YouTube link or a full TikTok video link (tiktok.com/@user/video/…).");
            return;
          }
          if (embeds.some((e) => e.platform === parsed.platform && e.id === parsed.id)) {
            setError("That video is already added.");
            setDraft("");
            return;
          }
          if (embeds.length >= MAX_VIDEO_EMBEDS) {
            setError(`You can add up to ${MAX_VIDEO_EMBEDS} videos.`);
            return;
          }
          field.onChange([...embeds, parsed]);
          setDraft("");
          setError(null);
        };
        const remove = (i: number) => field.onChange(embeds.filter((_, idx) => idx !== i));

        return (
          <Field label="Video links" hint="YouTube or TikTok — shown between the ingredients and the method">
            <div className="mt-2 flex gap-2">
              <Input
                type="url"
                value={draft}
                onChange={(e) => { setDraft(e.target.value); setError(null); }}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
                placeholder="https://youtube.com/watch?v=… or https://tiktok.com/@user/video/…"
              />
              <Button type="button" onClick={add} className="px-4 py-2 text-sm">Add</Button>
            </div>
            {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
            {embeds.length ? (
              <ul className="mt-3 flex flex-col gap-2">
                {embeds.map((e, i) => (
                  <li
                    key={`${e.platform}-${e.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="rounded-full bg-apb/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-apb">
                        {e.platform}
                      </span>
                      <span className="truncate text-neutral-600">{e.url}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => remove(i)}
                      aria-label="Remove"
                      className="px-2 text-lg leading-none text-neutral-400 hover:text-red-600"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </Field>
        );
      }}
    />
  );
}
