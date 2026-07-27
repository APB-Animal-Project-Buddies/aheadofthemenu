/**
 * /eat-this/{id} — one live dish at one restaurant, server-rendered.
 *
 * The catalogue at /eat-this is a single client-rendered page, so until now no
 * eat-this entry had a URL of its own: nothing to index, nothing to link, and
 * nothing for an agent or a chat unfurl to cite. See
 * docs/superpowers/specs/2026-07-17-seo-sitemap-and-indexable-pages-design.md.
 *
 * Read-only by design. Voting, comments, photos, reports and edits all stay on
 * the catalogue, where the client state that drives them already lives — this
 * page's job is to be a stable, crawlable, citable address. It links back for
 * anything interactive.
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import { graphql } from "@/lib/nhost";
import { aggregateVotes, meterState, type VoteRow } from "@/lib/eat-this";
import { absoluteUrl } from "@/lib/site-url";
import { truncateAtWord } from "@/lib/meta-text";

// ISR: entries change on the order of days, and votes are shown as a band
// rather than a live figure, so five minutes of staleness is invisible.
export const revalidate = 300;

type DishRow = {
  id: string;
  name: string;
  description: string | null;
  tags: unknown;
  details: {
    ingredients?: string[];
    allergens?: Array<{ name: string; optional?: boolean }>;
    flavors?: string[];
  } | null;
  availability: string;
  status: string;
  created_at: string;
  restaurant: {
    id: string;
    name: string;
    website: string | null;
    verified: boolean;
    locations: Array<{ address: string; neighborhood: string | null }>;
  } | null;
  votes: VoteRow[];
  comments: Array<{ id: string; body: string; created_at: string }>;
};

const QUERY = `query ($id: uuid!) {
  restaurant_dishes_by_pk(id: $id) {
    id name description tags details availability status created_at
    restaurant {
      id name website verified
      locations(order_by: { created_at: asc }, limit: 1) { address neighborhood }
    }
    votes { value voter_kind customizations }
    comments(where: { visibility: { _eq: "public" } }, order_by: { created_at: desc }, limit: 10) {
      id body created_at
    }
  }
}`;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function getDish(id: string): Promise<DishRow | null> {
  // A malformed id would make Hasura error on the uuid! variable rather than
  // return null, so screen it here and let notFound() handle it.
  if (!UUID_RE.test(id)) return null;
  const res = await graphql<{ restaurant_dishes_by_pk: DishRow | null }>(QUERY, {
    useAdminSecret: true,
    variables: { id },
    revalidate,
  });
  if (res.errors?.length) return null;
  const row = res.data?.restaurant_dishes_by_pk ?? null;
  // Hidden dishes are not public content; treat them as missing.
  if (!row || row.status !== "live" || !row.restaurant) return null;
  return row;
}

const tagList = (tags: unknown): string[] =>
  Array.isArray(tags) ? tags.filter((t): t is string => typeof t === "string") : [];

export async function generateMetadata({ params }: { params: { id: string } }) {
  const dish = await getDish(params.id);
  if (!dish) return { title: "Dish not found" };

  const venue = dish.restaurant!.name;
  const hood = dish.restaurant!.locations?.[0]?.neighborhood;
  const where = hood ? `${venue}, ${hood}` : venue;

  const ingredients = dish.details?.ingredients ?? [];
  const fallback = ingredients.length
    ? `${dish.name} at ${where} — made with ${ingredients.slice(0, 5).join(", ")}.`
    : `${dish.name}, a plant-based dish you can order at ${where}.`;
  const description = truncateAtWord(dish.description || fallback);

  return {
    title: `${dish.name} at ${venue}`,
    description,
    alternates: { canonical: absoluteUrl(`/eat-this/${dish.id}`) },
    openGraph: {
      title: `${dish.name} at ${venue}`,
      description,
      url: absoluteUrl(`/eat-this/${dish.id}`),
      type: "article",
    },
  };
}

function Pill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "accent" }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs ${
        tone === "accent" ? "bg-apb/10 text-apb" : "bg-neutral-100 text-neutral-600"
      }`}
    >
      {children}
    </span>
  );
}

function DetailRow({ label, items }: { label: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="flex items-baseline gap-3">
      <span className="w-28 shrink-0 text-[10px] font-bold tracking-wide text-neutral-400 uppercase">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {items.map((i) => (
          <Pill key={i}>{i}</Pill>
        ))}
      </div>
    </div>
  );
}

export default async function EatThisDishPage({ params }: { params: { id: string } }) {
  const dish = await getDish(params.id);
  if (!dish) notFound();

  const venue = dish.restaurant!;
  const location = venue.locations?.[0] ?? null;
  const tags = tagList(dish.tags);
  const { locals, visitors } = aggregateVotes(dish.votes ?? []);

  // One overall band across both cohorts. Uses meterState so this page tells
  // exactly the same truth as the catalogue — including withholding the
  // percentage entirely below MIN_VOTES_TO_SCORE, so an early number never
  // anchors a reader.
  const overall = meterState({
    up: (locals.up ?? 0) + (visitors.up ?? 0),
    meh: (locals.meh ?? 0) + (visitors.meh ?? 0),
    down: (locals.down ?? 0) + (visitors.down ?? 0),
  });

  const allergens = (dish.details?.allergens ?? []).map((a) =>
    a.optional ? `${a.name} (optional)` : a.name
  );

  return (
    <main className="mx-auto max-w-3xl px-5 py-8 md:px-8">
      <Link href="/eat-this" className="text-sm text-neutral-500 transition hover:text-apb">
        ← Back to Eat This!
      </Link>

      <article className="mt-4 rounded-[20px] border border-neutral-200 bg-white p-6">
        <header>
          <h1 className="font-serif text-2xl font-bold text-apb md:text-3xl">{dish.name}</h1>
          <p className="mt-1.5 text-neutral-600">
            from <span className="font-medium text-neutral-800">{venue.name}</span>
            {location?.neighborhood ? <> · {location.neighborhood}</> : null}
            {venue.verified ? <span className="ml-2 text-xs text-emerald-600">✓ verified</span> : null}
          </p>
          {dish.availability === "seasonal" ? (
            <p className="mt-2">
              <Pill tone="accent">Seasonal — may not always be on the menu</Pill>
            </p>
          ) : null}
        </header>

        <section className="mt-5 rounded-2xl bg-neutral-50 p-4" aria-label="Yum Meter">
          {overall.state === "scored" ? (
            <p className="text-sm text-neutral-700">
              <span className="text-2xl font-bold" style={{ color: overall.tier.color }}>
                {overall.pct}%
              </span>{" "}
              <span className="font-medium" style={{ color: overall.tier.color }}>
                {overall.tier.label}
              </span>{" "}
              <span className="text-neutral-500">
                · {overall.votes} vote{overall.votes === 1 ? "" : "s"}
              </span>
            </p>
          ) : overall.state === "tallying" ? (
            <p className="text-sm text-neutral-600">
              Still tallying — {overall.votes} vote{overall.votes === 1 ? "" : "s"} so far.
            </p>
          ) : (
            <p className="text-sm text-neutral-500">No votes yet.</p>
          )}
          <p className="mt-2 text-xs text-neutral-500">
            <Link href="/eat-this" className="underline hover:text-apb">
              Rate it on the catalogue
            </Link>
          </p>
        </section>

        {dish.description ? (
          <p className="mt-5 leading-relaxed text-neutral-700">{dish.description}</p>
        ) : null}

        {tags.length ? (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <Pill key={t} tone="accent">
                {t}
              </Pill>
            ))}
          </div>
        ) : null}

        <div className="mt-5 space-y-2.5">
          <DetailRow label="Flavors" items={dish.details?.flavors ?? []} />
          <DetailRow label="Ingredients" items={dish.details?.ingredients ?? []} />
          <DetailRow label="Allergens" items={allergens} />
        </div>

        {location || venue.website ? (
          <footer className="mt-6 border-t border-neutral-100 pt-4 text-sm text-neutral-600">
            {location?.address ? <p>{location.address}</p> : null}
            {venue.website ? (
              <p className="mt-1">
                <a
                  href={venue.website}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="underline hover:text-apb"
                >
                  {venue.website.replace(/^https?:\/\//, "")}
                </a>
              </p>
            ) : null}
          </footer>
        ) : null}
      </article>

      {dish.comments?.length ? (
        <section className="mt-6">
          <h2 className="font-serif text-lg font-semibold text-apb">What people say</h2>
          <ul className="mt-3 space-y-3">
            {dish.comments.map((c) => (
              <li key={c.id} className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-700">
                {c.body}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
