// Suggest an edit — public. Prefills the recipe form and submits a PENDING
// proposal (POST /api/dishes/[id]/edits) for an admin to review. The live dish
// is not changed.
import Link from "next/link";
import { notFound } from "next/navigation";
import { graphql } from "@/lib/nhost";
import { RecipeIntakeForm } from "@/app/submit-dish/RecipeIntakeForm";
import { dishToFormValues } from "@/app/submit-dish/ingredient-format";

export const dynamic = "force-dynamic";

async function getDish(id) {
  const n = Number(id);
  if (!Number.isInteger(n)) return null;
  const res = await graphql(
    `query GetDish($id: Int!) { dishes(where: { id: { _eq: $id } }) { id dish_name dish_data } }`,
    { useAdminSecret: true, variables: { id: n } }
  );
  if (res.errors) return null;
  return res.data?.dishes?.[0] ?? null;
}

export default async function SuggestEditPage({ params }) {
  const row = await getDish(params.id);
  if (!row) notFound();
  const initialValues = dishToFormValues(row.dish_data || {});

  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <Link href={`/dishes/${row.id}`} className="text-sm font-medium text-apb hover:underline">
        ← Back to dish
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-apb">Suggest an edit</h1>
      <p className="mt-2 text-neutral-600">
        Propose changes to this recipe. Your suggestion is reviewed by an admin before it goes live —
        the dish won&rsquo;t change until it&rsquo;s approved. Add your name so we can credit you.
      </p>
      <div className="mt-6">
        <RecipeIntakeForm dishId={row.id} initialValues={initialValues} mode="propose" />
      </div>
    </main>
  );
}
