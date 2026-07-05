// Full dish page — a beautifully formatted, server-rendered view of one submitted
// dish. Reached from the "View full dish" action on /dishes. Renders the dish_data
// shape produced by the submit form (lib/dishes.ts buildDishData), including the
// two ingredient formats: legacy flat rows AND rows with sections + nested
// alternatives.
import Link from "next/link";
import { notFound } from "next/navigation";
import { graphql } from "@/lib/nhost";
import { TRIED_BY_LABELS } from "@/lib/dishes";
import { DishActions } from "./DishActions";
import { DishGallery } from "@/components/DishGallery";

export const dynamic = "force-dynamic";

async function getDish(id) {
  const n = Number(id);
  if (!Number.isInteger(n)) return null;
  const query = `
    query GetDish($id: Int!) {
      dishes(where: { id: { _eq: $id } }) {
        id
        dish_name
        dish_data
        created_at
      }
    }`;
  const res = await graphql(query, { useAdminSecret: true, variables: { id: n } });
  if (res.errors) return null;
  return res.data?.dishes?.[0] ?? null;
}

// ── small presentational helpers ───────────────────────────────────────────
const fmtUnit = (u) => (u ? String(u).replace(/_/g, " ") : "");
const fmtQty = (q) => (q === null || q === undefined || q === "" ? "" : String(q));

function lineText(line) {
  // "0.75 cup white basmati rice" — omit empty qty/unit gracefully.
  return [fmtQty(line.quantity), fmtUnit(line.unit), line.name].filter(Boolean).join(" ");
}

// Group flat ingredients by section, preserving first-appearance order.
// A missing/empty section becomes the leading unnamed group.
function groupBySection(ingredients) {
  const groups = [];
  const byName = new Map();
  for (const ing of ingredients ?? []) {
    const key = (ing.section || "").trim();
    let g = byName.get(key);
    if (!g) {
      g = { section: key, items: [] };
      byName.set(key, g);
      groups.push(g);
    }
    g.items.push(ing);
  }
  return groups;
}

function Chip({ children }) {
  return (
    <span className="inline-flex items-center rounded-full bg-apb-cream px-3 py-1 text-xs font-medium text-apb ring-1 ring-apb/15">
      {children}
    </span>
  );
}

function Section({ title, children }) {
  return (
    <section className="mt-8">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-apb/70">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

// ── ingredients (sections + nested alternatives) ────────────────────────────
function Ingredients({ ingredients }) {
  const groups = groupBySection(ingredients);
  return (
    <div className="flex flex-col gap-6">
      {groups.map((g, gi) => (
        <div key={gi} className="rounded-[16px] border border-apb/30 bg-apb-light/10 p-5">
          {g.section ? (
            <h3 className="mb-2 text-lg font-semibold text-apb">{g.section}</h3>
          ) : null}
          <ul className="flex flex-col gap-3">
            {g.items.map((ing, ii) => (
              <li key={ii}>
                <span className="text-sm text-neutral-800">{lineText(ing)}</span>
                {ing.note ? <span className="ml-2 text-xs italic text-neutral-500">— {ing.note}</span> : null}
                {Array.isArray(ing.alternatives) && ing.alternatives.length > 0 ? (
                  <ul className="mt-1.5 flex flex-col gap-1">
                    {ing.alternatives.map((alt, ai) => (
                      <li key={ai} className="text-xs text-neutral-600">
                        <span className="font-medium text-apb">Alternative {ai + 1}:</span>{" "}
                        {alt.label ? <span className="font-medium">{alt.label} — </span> : null}
                        {(alt.items ?? []).map((x) => lineText(x)).filter(Boolean).join(" + ")}
                        {alt.note ? <span className="block italic text-neutral-500">{alt.note}</span> : null}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/** Format one substitution entry from review_instance.substitutions (jsonb). */
function subText(s) {
  if (!s || typeof s !== "object") return String(s ?? "");
  if (s.note) return s.note;
  const items = Array.isArray(s.items) ? s.items.join(", ") : "";
  if (s.from && items) return `${s.from} → ${items}`;
  return s.label || items || s.from || "";
}

async function getInstance(code, dishId) {
  if (!code) return null;
  const query = `
    query GetInstance($code: bpchar!, $dishId: Int!) {
      review_instance(where: { id: { _eq: $code }, dish_id: { _eq: $dishId } }, limit: 1) {
        id name substitutions allergens active_until
      }
    }`;
  const res = await graphql(query, { useAdminSecret: true, variables: { code, dishId: Number(dishId) } });
  if (res.errors?.length) return null;
  return res.data?.review_instance?.[0] ?? null;
}

// Public dish instances — cooks who opted in to publishing their version.
// Deliberately NO active_until filter: public instances are permanent; the
// 24h window only governs the review-link lifecycle. Fails quiet (empty
// list) if the visibility migration isn't applied yet.
async function getPublicInstances(dishId) {
  const query = `
    query PublicInstances($dishId: Int!) {
      review_instance(
        where: { dish_id: { _eq: $dishId }, visibility: { _eq: "public" } }
        order_by: { timestamp: desc }
        limit: 20
      ) { id name chef_type substitutions allergens difficulty notes timestamp }
    }`;
  try {
    const res = await graphql(query, { useAdminSecret: true, variables: { dishId: Number(dishId) } });
    if (res.errors?.length) {
      console.warn("getPublicInstances: query rejected (visibility migration applied? metadata reloaded?)", res.errors[0]?.message);
      return [];
    }
    return res.data?.review_instance ?? [];
  } catch (e) {
    console.warn("getPublicInstances: transport error, rendering without the section", e instanceof Error ? e.message : e);
    return [];
  }
}

export default async function DishPage({ params, searchParams }) {
  const row = await getDish(params.id);
  if (!row) notFound();

  // Optional dish-instance overlay: /dishes/[id]?instance=<code> shows this
  // cook's version (substitutions + allergens) above the base recipe — but only
  // while the instance is still active.
  const instanceCode = typeof searchParams?.instance === "string" ? searchParams.instance : null;
  // Kick off the public-instances read alongside the overlay lookup — the two
  // queries are independent, no reason to pay for them sequentially.
  const publicInstancesPromise = getPublicInstances(params.id);
  const instance = instanceCode ? await getInstance(instanceCode, params.id) : null;
  const instanceActive = instance?.active_until
    ? new Date(instance.active_until).getTime() > Date.now()
    : false;
  const subs = Array.isArray(instance?.substitutions) ? instance.substitutions : [];
  const publicInstances = await publicInstancesPromise;

  const d = row.dish_data || {};
  const v = d.validation || {};
  const created = row.created_at ? new Date(row.created_at).toLocaleDateString() : null;
  const has = (a) => Array.isArray(a) && a.length > 0;

  return (
    <main className="mx-auto max-w-3xl px-4 pb-36 pt-10">
      <div className="flex items-center justify-between gap-3 pr-12">
        <Link href="/dishes" className="text-sm font-medium text-apb hover:underline">
          ← All dishes
        </Link>
        <DishActions dishId={row.id} />
      </div>

      {/* Your version — the selected dish instance's substitutions + allergens,
          shown above the base recipe while the instance is active. */}
      {instance && instanceActive ? (
        <section className="mt-4 rounded-[16px] border-2 border-apb/30 bg-apb-cream p-5">
          <p className="font-serif text-lg font-semibold text-apb">
            Your version
            {instance.name ? <span className="font-normal text-neutral-500"> · by {instance.name}</span> : null}
          </p>
          {has(subs) ? (
            <div className="mt-3">
              <p className="text-sm font-medium text-neutral-600">Substitutions</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-neutral-700">
                {subs.map((s, i) => <li key={`sub-${i}`}>{subText(s)}</li>)}
              </ul>
            </div>
          ) : null}
          {has(instance.allergens) ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-neutral-600">Allergens:</span>
              {instance.allergens.map((a) => (
                <span key={`ia-${a}`} className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold capitalize text-amber-800">
                  {a}
                </span>
              ))}
            </div>
          ) : null}
          <p className="mt-3 text-xs text-neutral-500">The full base recipe is below.</p>
        </section>
      ) : null}

      {/* Header */}
      <header className="mt-4">
        {instance && instanceActive ? (
          <Link
            href={`/s/${instanceCode}`}
            className="mb-4 inline-flex items-center gap-2 rounded-full bg-apb px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-apb-light"
          >
            🌱 Review this dish
          </Link>
        ) : null}
        {d.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- nhost storage host isn't in next/image config
          <img
            src={d.image}
            alt={d.title || row.dish_name || "Dish photo"}
            className="mx-auto mb-5 max-h-[420px] w-full max-w-2xl rounded-[20px] object-cover shadow-sm"
            loading="eager"
          />
        ) : null}
        <h1 className="text-3xl font-bold text-apb">{d.title || row.dish_name || "Untitled dish"}</h1>
        {d.description ? (
          <p className="mt-3 text-lg leading-relaxed text-neutral-700">{d.description}</p>
        ) : null}
        {(has(d.cuisines) || has(d.dishType)) ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {(d.cuisines ?? []).map((c) => <Chip key={`c-${c}`}>{c}</Chip>)}
            {(d.dishType ?? []).map((t) => <Chip key={`t-${t}`}>{t}</Chip>)}
          </div>
        ) : null}
      </header>

      {/* Allergen warning — prominent, at the top */}
      {has(d.allergens) ? (
        <div className="mt-6 rounded-[16px] border-2 border-red-300 bg-red-50 p-5">
          <p className="text-base font-bold uppercase tracking-wide text-red-700">⚠ Contains allergens</p>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {d.allergens.map((a) => (
              <span key={`al-${a}`} className="inline-flex items-center rounded-full bg-red-600 px-4 py-1.5 text-sm font-semibold uppercase tracking-wide text-white">
                {a}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {/* Meta strip */}
      {(d.servings != null || d.prepTime || d.cookTime || d.cost != null || d.originalCreator || d.resourceLink) ? (
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-[16px] border border-neutral-200 bg-white/60 px-5 py-4 text-sm">
          {d.servings != null ? (
            <span className="text-neutral-700"><span className="text-neutral-400">Serves:</span> <strong className="text-apb">{d.servings}</strong></span>
          ) : null}
          {d.prepTime ? (
            <span className="text-neutral-700"><span className="text-neutral-400">Prep:</span> <strong className="text-apb">{d.prepTime}</strong></span>
          ) : null}
          {d.cookTime ? (
            <span className="text-neutral-700"><span className="text-neutral-400">Cook:</span> <strong className="text-apb">{d.cookTime}</strong></span>
          ) : null}
          {d.cost != null ? (
            <span className="text-neutral-700"><span className="text-neutral-400">Cost / serving:</span> <strong className="text-apb">${Number(d.cost).toFixed(2)}</strong></span>
          ) : null}
          {d.originalCreator ? (
            <span className="text-neutral-700"><span className="text-neutral-400">By:</span> {d.originalCreator}</span>
          ) : null}
          {d.resourceLink ? (
            <a href={d.resourceLink} target="_blank" rel="noopener noreferrer" className="font-medium text-apb hover:underline">
              Original recipe ↗
            </a>
          ) : null}
        </div>
      ) : null}

      {has(d.tags) ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {d.tags.map((t) => <Chip key={`tag-${t}`}>#{t}</Chip>)}
        </div>
      ) : null}

      {/* Ingredients */}
      {has(d.ingredients) ? (
        <Section title="Ingredients">
          <Ingredients ingredients={d.ingredients} />
        </Section>
      ) : null}

      {/* Steps */}
      {has(d.steps) ? (
        <Section title="Method">
          <ol className="flex flex-col gap-4">
            {d.steps.map((s, i) => (
              <li key={i} className="flex gap-4 rounded-[12px] border border-neutral-200 bg-white/60 p-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-apb text-sm font-bold text-white">{i + 1}</span>
                <span className="text-base leading-relaxed text-neutral-800">{s}</span>
              </li>
            ))}
          </ol>
        </Section>
      ) : null}

      {/* Original recipe — orange button for maximum visibility. */}
      {d.resourceLink ? (
        <div className="mt-8 rounded-[16px] border-2 border-orange-300 bg-orange-50 p-6">
          <p className="mb-4 text-sm font-medium text-neutral-700">To see full recipe:</p>
          <a
            href={d.resourceLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-8 py-3 text-lg font-bold text-white shadow-lg transition hover:bg-orange-600 hover:shadow-xl"
          >
            View the original recipe{d.originalCreator ? ` by ${d.originalCreator}` : ""} ↗
          </a>
        </div>
      ) : null}

      {/* Special products / equipment */}
      {(has(d.specialProducts) || d.specialEquipment) ? (
        <Section title="Special products & equipment">
          {has(d.specialProducts) ? (
            <div className="flex flex-wrap gap-2">
              {d.specialProducts.map((p) => <Chip key={`sp-${p}`}>{p}</Chip>)}
            </div>
          ) : null}
          {d.specialEquipment ? (
            <p className="mt-2 text-sm text-neutral-700">{d.specialEquipment}</p>
          ) : null}
        </Section>
      ) : null}

      {/* Validation */}
      {(has(v.triedBy) || v.feedback || v.rating != null || v.reviewCount != null) ? (
        <Section title="How it's validated">
          <div className="rounded-[16px] border border-neutral-200 bg-white/60 p-5 text-sm">
            {has(v.triedBy) ? (
              <div className="flex flex-wrap gap-2">
                {v.triedBy.map((t) => <Chip key={`tb-${t}`}>{TRIED_BY_LABELS[t] ?? t}</Chip>)}
              </div>
            ) : null}
            {(v.rating != null || v.reviewCount != null) ? (
              <p className="mt-3 text-neutral-700">
                {v.rating != null ? <span><strong className="text-apb">{v.rating}</strong>/{v.ratingScale ?? 5}</span> : null}
                {v.reviewCount != null ? <span className="text-neutral-400"> · {v.reviewCount} reviews</span> : null}
              </p>
            ) : null}
            {v.feedback ? <p className="mt-3 italic text-neutral-600">“{v.feedback}”</p> : null}
          </div>
        </Section>
      ) : null}

      {/* Notes */}
      {d.notes ? (
        <Section title="Notes">
          <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-700">{d.notes}</p>
        </Section>
      ) : null}

      {/* Cooked by others — publicly published dish instances (permanent). */}
      {publicInstances.length ? (
        <Section title="Cooked by others">
          <div className="flex flex-col gap-4">
            {publicInstances.map((pi) => (
              <div key={pi.id} className="rounded-[16px] border border-apb/30 bg-apb-cream p-5">
                <p className="font-serif text-lg font-semibold text-apb">
                  {pi.name}
                  <span className="font-normal text-neutral-500">
                    {pi.chef_type ? ` · ${pi.chef_type}` : ""}
                    {pi.timestamp ? ` · ${new Date(pi.timestamp).toLocaleDateString()}` : ""}
                  </span>
                </p>
                {has(pi.substitutions) ? (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-neutral-600">Substitutions</p>
                    <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-neutral-700">
                      {pi.substitutions.map((s, i) => <li key={`ps-${pi.id}-${i}`}>{subText(s)}</li>)}
                    </ul>
                  </div>
                ) : null}
                {has(pi.allergens) ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-neutral-600">Allergens:</span>
                    {pi.allergens.map((a) => (
                      <span key={`pa-${pi.id}-${a}`} className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold capitalize text-amber-800">
                        {a}
                      </span>
                    ))}
                  </div>
                ) : null}
                {pi.difficulty != null ? (
                  <p className="mt-3 text-sm text-neutral-600">Difficulty: <strong className="text-apb">{pi.difficulty}</strong>/5</p>
                ) : null}
                {pi.notes ? <p className="mt-2 text-sm italic text-neutral-600">"{pi.notes}"</p> : null}
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {/* Footer */}
      {/* Community photos & videos of this recipe. */}
      <DishGallery dishId={row.id} />

      <footer className="mt-10 border-t border-neutral-200 pt-4 text-xs text-neutral-400">
        {d.submittedBy?.name ? <>Submitted by {d.submittedBy.name}</> : "Submitted"}
        {created ? <> · {created}</> : null}
      </footer>

      {/* Prominent floating CTA to log your own instance of this dish. */}
      <Link
        href={`/reviews/create?dishId=${row.id}`}
        className="fixed inset-x-4 bottom-10 z-40 mx-auto flex max-w-lg flex-col items-center justify-center rounded-3xl bg-apb px-8 py-4 text-center text-white shadow-2xl shadow-apb/40 ring-4 ring-apb-accent/60 transition hover:scale-[1.02] hover:bg-apb-light"
      >
        <span className="text-lg font-bold sm:text-xl">🌱 Did you make this dish?</span>
        <span className="mt-0.5 text-xs font-medium text-white/80 sm:text-sm">
          Click here to help with the plant-based transition
        </span>
      </Link>
    </main>
  );
}
