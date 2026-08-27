import { DishIntakeForm } from "./DishIntakeForm";
import { DISH_FORM_DEFAULTS } from "./types";
export const dynamic = "force-dynamic";
// /submit-dish?creator=<name> prefills the creator field (linked from a creator page's "Add a recipe").
export default function SubmitDishPage({ searchParams }: { searchParams?: { creator?: string } }) {
  const creator = typeof searchParams?.creator === "string" ? searchParams.creator.trim().slice(0, 120) : "";
  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <h1 className="text-2xl font-bold text-apb">Submit a dish</h1>
      <p className="mt-2 text-neutral-600">Share a plant-based dish. Only the name is required.</p>
      <div className="mt-6">
        <DishIntakeForm initialValues={creator ? { ...DISH_FORM_DEFAULTS, originalCreator: creator } : undefined} />
      </div>
    </main>
  );
}
