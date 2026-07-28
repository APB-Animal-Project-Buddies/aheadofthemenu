// Public creator profile — /creators/[slug]. Server-rendered directory page:
// photo, bio, social links, most-watched clips (muted autoplay embeds), and the
// creator's dishes. Data comes from the creators row (profile columns added by
// migration 1783400000000) + dishes linked by creator_id or legacy
// dish_data.originalCreator (see lib/creators.ts getCreatorDishes).
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCreatorProfileBySlug,
  getCreatorDishes,
  orderedSocials,
  type CreatorProfile,
  type CreatorTopVideo,
} from "@/lib/creators";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const creator = await getCreatorProfileBySlug(params.slug).catch(() => null);
  if (!creator) return { title: "Creator not found" };
  const name = creator.display_name;
  return {
    title: `${name} — Creator`,
    description: creator.bio ?? `Recipes and profile for ${name}.`,
  };
}

function SocialLinks({ creator }: { creator: CreatorProfile }) {
  // Present socials, primary_social pinned first (the creator's "current profile").
  const links = orderedSocials(creator);
  const extra = (creator.other_links ?? []).filter((l) => l && l.url);
  if (!links.length && !extra.length) return null;
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {links.map(({ key, label, url }) => {
        const isPrimary = key === creator.primary_social;
        return (
          <a
            key={key}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={
              isPrimary
                ? "rounded-full bg-apb px-4 py-1.5 text-sm font-semibold text-white transition hover:opacity-90"
                : "rounded-full border border-neutral-200 bg-white/70 px-4 py-1.5 text-sm font-medium text-apb transition hover:border-apb hover:bg-white"
            }
          >
            {label}
          </a>
        );
      })}
      {extra.map((l, i) => (
        <a
          key={`x-${i}`}
          href={l.url}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-neutral-200 bg-white/70 px-4 py-1.5 text-sm font-medium text-neutral-600 transition hover:border-apb hover:bg-white"
        >
          {l.label || new URL(l.url).hostname.replace(/^www\./, "")}
        </a>
      ))}
    </div>
  );
}

function VideoEmbed({ platform, video }: { platform: "youtube" | "tiktok" | "instagram"; video: CreatorTopVideo }) {
  const src = video.embed_url ?? null;
  const label = platform === "youtube" ? "YouTube" : platform === "tiktok" ? "TikTok" : "Instagram";
  // YouTube renders 16:9; TikTok/Instagram are vertical 9:16 with a capped width.
  const vertical = platform !== "youtube";
  return (
    <div className={vertical ? "w-full max-w-[325px]" : "w-full"}>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
        {label}
        {video.approx_views ? <span className="ml-2 font-normal normal-case text-neutral-400">{video.approx_views} views</span> : null}
      </div>
      {src ? (
        <div
          className={`relative overflow-hidden rounded-[16px] border border-neutral-200 bg-black ${vertical ? "aspect-[9/16]" : "aspect-video"}`}
        >
          <iframe
            src={src}
            title={video.title ?? `${label} video`}
            className="absolute inset-0 h-full w-full"
            allow="autoplay; encrypted-media; picture-in-picture; clipboard-write"
            allowFullScreen
            loading="lazy"
          />
        </div>
      ) : (
        <a
          href={video.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex aspect-video items-center justify-center rounded-[16px] border border-neutral-200 bg-white/60 px-4 text-center text-sm font-medium text-apb hover:underline"
        >
          Watch on {label} ↗
        </a>
      )}
      {video.title ? <p className="mt-2 line-clamp-2 text-sm text-neutral-600">{video.title}</p> : null}
    </div>
  );
}

export default async function CreatorPage({ params }: { params: { slug: string } }) {
  const creator = await getCreatorProfileBySlug(params.slug).catch(() => null);
  if (!creator) notFound();

  const dishes = await getCreatorDishes(creator).catch(() => []);
  const tv = creator.top_videos ?? {};
  const videoEntries = (["youtube", "tiktok", "instagram"] as const)
    .map((p) => [p, tv[p]] as const)
    .filter(([, v]) => v && v.url);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/dishes" className="text-sm text-neutral-400 hover:text-apb">← All dishes</Link>

      {/* Header */}
      <header className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-start">
        {creator.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- external/re-hosted URLs, no next/image domains configured
          <img
            src={creator.image_url}
            alt={creator.display_name}
            className="h-28 w-28 shrink-0 rounded-full border border-neutral-200 object-cover"
          />
        ) : (
          <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-apb/10 text-3xl font-bold text-apb">
            {creator.display_name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-3xl font-bold text-apb">{creator.display_name}</h1>
          {creator.creator_name && creator.creator_name !== creator.display_name ? (
            <p className="text-neutral-500">{creator.creator_name}</p>
          ) : null}
          {creator.real_name && creator.real_name !== creator.display_name ? (
            <p className="text-sm text-neutral-400">{creator.real_name}</p>
          ) : null}
          {creator.website ? (
            <a
              href={creator.website}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-sm font-medium text-apb hover:underline"
            >
              {new URL(creator.website).hostname.replace(/^www\./, "")} ↗
            </a>
          ) : null}
          <SocialLinks creator={creator} />
        </div>
      </header>

      {/* Bio */}
      {creator.bio ? (
        <p className="mt-6 rounded-[16px] border border-neutral-200 bg-white/60 px-5 py-4 leading-relaxed text-neutral-800">
          {creator.bio}
        </p>
      ) : null}

      {/* Most-watched clips */}
      {videoEntries.length ? (
        <section className="mt-8">
          <h2 className="mb-3 text-xl font-bold text-apb">Most watched</h2>
          <div className="flex flex-wrap gap-6">
            {videoEntries.map(([p, v]) => (
              <VideoEmbed key={p} platform={p} video={v as CreatorTopVideo} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Dishes */}
      <section className="mt-8">
        <h2 className="mb-3 text-xl font-bold text-apb">
          Recipes{dishes.length ? ` (${dishes.length})` : ""}
        </h2>
        {dishes.length ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {dishes.map((d) => {
              const title = d.dish_data?.title || d.dish_name || "Untitled dish";
              const img = d.dish_data?.image;
              return (
                <Link
                  key={d.id}
                  href={`/dishes/${d.id}`}
                  className="group overflow-hidden rounded-[16px] border border-neutral-200 bg-white/60 transition hover:border-apb"
                >
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt={title} className="aspect-square w-full object-cover" />
                  ) : (
                    <div className="flex aspect-square w-full items-center justify-center bg-apb/5 text-2xl">🍽️</div>
                  )}
                  <div className="p-2 text-sm font-medium leading-snug text-neutral-800 group-hover:text-apb">{title}</div>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-neutral-400">No dishes linked to this creator yet.</p>
        )}
      </section>
    </main>
  );
}
