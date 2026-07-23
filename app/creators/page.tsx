// Creators gallery — /creators. A searchable, cuisine-filterable grid of every
// creator with a profile or dishes. Data (creators + cuisines derived from their
// dishes) is fetched server-side; search/filter happen client-side in
// CreatorsGallery.
import { getCreatorsGallery } from "@/lib/creators";
import { CreatorsGallery } from "@/components/CreatorsGallery";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Creators",
  description: "Browse and search the vegan recipe creators featured on Ahead of the Menu.",
};

export default async function CreatorsPage() {
  const creators = await getCreatorsGallery().catch(() => []);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-bold text-apb">Creators</h1>
      <p className="mt-1 text-neutral-500">
        Browse the vegan recipe creators behind the dishes — search by name or filter by cuisine.
      </p>
      <div className="mt-6">
        {creators.length ? (
          <CreatorsGallery creators={creators} />
        ) : (
          <p className="text-sm text-neutral-400">Creators are temporarily unavailable.</p>
        )}
      </div>
    </main>
  );
}
