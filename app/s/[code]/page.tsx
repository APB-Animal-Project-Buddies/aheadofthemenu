import { graphql } from "@/lib/nhost";
import { isValidShortCode, parseDishTarget } from "@/lib/reviews";
import { ReviewForm } from "./ReviewForm";

export const dynamic = "force-dynamic";
type DishData = { title?: string; description?: string; image?: string; photo?: string; allergens?: string[] };
type Dish = { id: number; dish_name: string | null; dish_data: DishData | null };
type Resolution = { kind: "ok"; dish: Dish } | { kind: "notfound" } | { kind: "error" };

async function resolveDish(code: string): Promise<Resolution> {
  if (!isValidShortCode(code)) return { kind: "notfound" };
  try {
    const res = await graphql<{ short_urls: Array<{ target_type: string; target_id: string }> }>(
      `query Resolve($code: String!) {
         short_urls(where: { short_code: { _eq: $code } }, limit: 1) { target_type target_id }
       }`,
      { useAdminSecret: true, variables: { code } }
    );
    if (res.errors?.length) return { kind: "error" };
    const dishId = parseDishTarget(res.data?.short_urls?.[0]);
    if (dishId === null) return { kind: "notfound" };

    const dishRes = await graphql<{ dishes: Dish[] }>(
      `query Dish($id: Int!) { dishes(where: { id: { _eq: $id } }, limit: 1) { id dish_name dish_data } }`,
      { useAdminSecret: true, variables: { id: dishId } }
    );
    if (dishRes.errors?.length) return { kind: "error" };
    const dish = dishRes.data?.dishes?.[0];
    return dish ? { kind: "ok", dish } : { kind: "notfound" };
  } catch {
    return { kind: "error" };
  }
}

function Centered({ title, body }: { title: string; body: string }) {
  return (
    <main className="mx-auto max-w-xl px-5 py-20 text-center">
      <h1 className="text-2xl font-bold text-apb">{title}</h1>
      <p className="mt-3 text-neutral-600">{body}</p>
    </main>
  );
}

export default async function ReviewPage({
  params,
  searchParams,
}: {
  params: { code: string };
  searchParams: { first_time?: string };
}) {
  const r = await resolveDish(params.code);
  if (r.kind === "error")
    return <Centered title="Temporarily unavailable" body="We couldn't load this review form right now. Please try again in a moment." />;
  if (r.kind === "notfound")
    return <Centered title="Link not found" body="This review link is invalid or has expired." />;

  const d = r.dish.dish_data ?? {};
  const title = d.title ?? r.dish.dish_name ?? "Untitled dish";
  const image = d.image ?? d.photo ?? null;
  // The creator opens their own link with ?first_time to leave the first review.
  const firstTime = searchParams?.first_time !== undefined;

  return (
    <main className="mx-auto max-w-xl px-5 py-10">
      {firstTime ? (
        <div className="mb-6 rounded-[16px] border border-apb/30 bg-apb-cream px-5 py-4">
          <p className="font-serif text-lg font-semibold text-apb">You&rsquo;re first! 🎉</p>
          <p className="mt-1 text-sm text-neutral-600">
            Leave your own take on how it turned out. Everyone you share this link with below can also review it too. Congratulations&nbsp;:)
          </p>
        </div>
      ) : (
        <div className="mb-6 rounded-[16px] border border-apb-light/30 bg-apb-light/10 px-5 py-3">
          <p className="text-sm font-medium text-apb">Yay! Thanks for reviewing this. You&rsquo;re the best.</p>
        </div>
      )}
      <header className="mb-8">
        {/* plain <img> on purpose: avoids next/image remote allowlist; next.config has no images config */}
        {image ? <img src={image} alt={title} className="mb-4 w-full rounded-[16px] object-cover" /> : null}
        <h1 className="text-2xl font-bold text-apb">{title}</h1>
        {d.description ? <p className="mt-2 text-neutral-600">{d.description}</p> : null}
        {Array.isArray(d.allergens) && d.allergens.length > 0 ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-neutral-500">Contains:</span>
            {d.allergens.map((a) => (
              <span key={a} className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium capitalize text-amber-800">
                {a}
              </span>
            ))}
          </div>
        ) : null}
      </header>
      <ReviewForm shortCode={params.code} />
    </main>
  );
}
