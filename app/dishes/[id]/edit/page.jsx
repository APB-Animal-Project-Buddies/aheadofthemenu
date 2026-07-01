// Edit a recipe — fetches the dish, prefills the intake form (in edit mode), and
// saves via PATCH /api/dishes/[id]. Reuses the whole submit form, including the
// nested sections + alternatives editor.
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

export default async function EditDishPage({ params }) {
  const row = await getDish(params.id);
  if (!row) notFound();
  const initialValues = dishToFormValues(row.dish_data || {});

  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <Link href={`/dishes/${row.id}`} className="text-sm font-medium text-apb hover:underline">
        ← Back to dish
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-apb">Edit recipe</h1>
      <p className="mt-2 text-neutral-600">Update any field and save. Empty a field to clear it.</p>
      <div className="mt-6">
        <RecipeIntakeForm dishId={row.id} initialValues={initialValues} />
      </div>
    </main>
  );
}
