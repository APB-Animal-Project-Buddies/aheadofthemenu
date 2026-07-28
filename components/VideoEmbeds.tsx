"use client";

/**
 * Click-to-load video embeds for a dish page. Shows a lightweight thumbnail +
 * play button; the real third-party iframe only mounts on click — better for
 * privacy and page speed. YouTube thumbnails are deterministic; TikTok posters
 * are resolved server-side (via oEmbed) and passed in, falling back to a branded
 * card when unavailable.
 */
import { useState } from "react";
import { youTubeEmbed, youTubeThumb, tikTokEmbed, type VideoPlatform } from "@/lib/video-embeds";

export type EmbedItem = {
  platform: VideoPlatform;
  id: string;
  url: string;
  thumbnail?: string | null;
};

const PLATFORM_LABEL: Record<VideoPlatform, string> = { youtube: "YouTube", tiktok: "TikTok" };

export function VideoEmbeds({ embeds }: { embeds: EmbedItem[] }) {
  const [playing, setPlaying] = useState<string | null>(null);
  if (!embeds?.length) return null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {embeds.map((e) => {
        const key = `${e.platform}:${e.id}`;
        const isPlaying = playing === key;
        const src = e.platform === "youtube" ? youTubeEmbed(e.id) : tikTokEmbed(e.id);
        const thumb = e.platform === "youtube" ? youTubeThumb(e.id) : e.thumbnail ?? null;
        const ratio = e.platform === "tiktok" ? "aspect-[9/16] max-h-[70vh]" : "aspect-video";
        return (
          <figure key={key} className="overflow-hidden rounded-[16px] border border-neutral-200 bg-black">
            <div className={`relative mx-auto w-full ${ratio}`}>
              {isPlaying ? (
                <iframe
                  src={src}
                  title={`${PLATFORM_LABEL[e.platform]} video`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setPlaying(key)}
                  aria-label={`Play ${PLATFORM_LABEL[e.platform]} video`}
                  className="group absolute inset-0 h-full w-full"
                >
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element -- external thumbnail host not in next/image config
                    <img
                      src={thumb}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover opacity-90 transition group-hover:opacity-100"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center bg-neutral-900 text-sm font-semibold uppercase tracking-wide text-neutral-300">
                      {PLATFORM_LABEL[e.platform]}
                    </span>
                  )}
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-black/60 text-white transition group-hover:scale-110 group-hover:bg-black/75">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="ml-1 h-6 w-6" aria-hidden>
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </span>
                  </span>
                  <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
                    {PLATFORM_LABEL[e.platform]}
                  </span>
                </button>
              )}
            </div>
          </figure>
        );
      })}
    </div>
  );
}
