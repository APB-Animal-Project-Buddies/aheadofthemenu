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
        <div key={gi}>
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

export default async function DishPage({ params }) {
  const row = await getDish(params.id);
  if (!row) notFound();

  const d = row.dish_data || {};
  const v = d.validation || {};
  const created = row.created_at ? new Date(row.created_at).toLocaleDateString() : null;
  const has = (a) => Array.isArray(a) && a.length > 0;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center justify-between gap-3 pr-12">
        <Link href="/dishes" className="text-sm font-medium text-apb hover:underline">
          ← All dishes
        </Link>
        <DishActions dishId={row.id} />
      </div>

      {/* Header */}
      <header className="mt-4">
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
      {(d.servings != null || d.prepTime || d.cost != null || d.originalCreator || d.resourceLink) ? (
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-[16px] border border-neutral-200 bg-white/60 px-5 py-4 text-sm">
          {d.servings != null ? (
            <span className="text-neutral-700"><span className="text-neutral-400">Serves:</span> <strong className="text-apb">{d.servings}</strong></span>
          ) : null}
          {d.prepTime ? (
            <span className="text-neutral-700"><span className="text-neutral-400">Prep:</span> <strong className="text-apb">{d.prepTime}</strong></span>
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

      {/* Footer */}
      <footer className="mt-10 border-t border-neutral-200 pt-4 text-xs text-neutral-400">
        {d.submittedBy?.name ? <>Submitted by {d.submittedBy.name}</> : "Submitted"}
        {created ? <> · {created}</> : null}
        <span className="mx-2">·</span>
        <Link href={`/reviews/create?dishId=${row.id}`} className="font-medium text-apb hover:underline">
          Create a review form
        </Link>
      </footer>
    </main>
  );
}
