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
  type CreatorTopVideo,
} from "@/lib/creators";
import { CreatorProfileEditor } from "@/components/CreatorProfileEditor";

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

/** Last tile of the Recipes grid: anyone can submit a dish attributed to this creator. */
function AddRecipeTile({ name }: { name: string }) {
  return (
    <Link
      href={`/submit-dish?creator=${encodeURIComponent(name)}`}
      className="flex aspect-square flex-col items-center justify-center gap-2 rounded-[16px] border-2 border-dashed border-apb/40 bg-apb/5 text-apb transition hover:border-apb hover:bg-apb/10"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-apb text-3xl font-light leading-none text-white">+</span>
      <span className="text-sm font-semibold">Add a recipe</span>
    </Link>
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

      {/* owner_id is the owner's auth user UUID — never sent to the browser.
          The editor learns ownership from the authenticated
          GET /api/creators/claims instead; `claimed` drives the public badge. */}
      <CreatorProfileEditor creator={{ ...creator, owner_id: null }} claimed={creator.owner_id !== null} />

      {/* Most-watched clips */}
      {videoEntries.length ? (
        <section className="mt-12">
          <h2 className="mb-3 text-xl font-bold text-apb">Most watched</h2>
          <div className="flex flex-wrap gap-6">
            {videoEntries.map(([p, v]) => (
              <VideoEmbed key={p} platform={p} video={v as CreatorTopVideo} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Dishes */}
      <section className="mt-12">
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
            <AddRecipeTile name={creator.display_name} />
          </div>
        ) : (
          <div>
            <p className="text-sm text-neutral-400">No dishes linked to this creator yet.</p>
            <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <AddRecipeTile name={creator.display_name} />
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
