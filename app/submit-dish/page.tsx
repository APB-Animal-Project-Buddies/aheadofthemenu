import { RecipeIntakeForm } from "./RecipeIntakeForm";
export const dynamic = "force-dynamic";
export default function SubmitDishPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <h1 className="text-2xl font-bold text-apb">Submit a recipe</h1>
      <p className="mt-2 text-neutral-600">Share a plant-based dish. Only the name is required.</p>
      <div className="mt-6"><RecipeIntakeForm /></div>
    </main>
  );
}
