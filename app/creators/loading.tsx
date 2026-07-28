/**
 * Suspense fallback for /creators.
 *
 * The page is a server component that awaits getCreatorsGallery(), so there is
 * no client-side loading state to hang a spinner off — Next renders this while
 * the server work is in flight.
 *
 * Deliberately mirrors the real layout: same heading, same search-box height,
 * same `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4` grid, same 80px circular
 * avatar. Anything that differs here becomes a visible jump when the real
 * gallery swaps in, which is the failure mode a skeleton exists to avoid.
 *
 * Shimmer comes from `.skeleton-shimmer` in globals.css — shared with the
 * /dishes grid skeleton so the two can't drift.
 */

const PLACEHOLDER_CARDS = 12;

export default function CreatorsLoading() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8" aria-busy="true">
      <h1 className="text-3xl font-bold text-apb">Creators</h1>
      <p className="mt-1 text-neutral-500">
        Browse the vegan recipe creators behind the dishes — search by name or filter by cuisine.
      </p>

      <div className="mt-6">
        {/* Search box */}
        <div className="h-10 w-full rounded-lg skeleton-shimmer" />

        {/* Cuisine filter chips */}
        <div className="mt-4 flex flex-wrap gap-2" aria-hidden="true">
          {[64, 80, 56, 72, 60].map((w, i) => (
            <div key={i} className="h-7 rounded-full skeleton-shimmer" style={{ width: w }} />
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4" aria-hidden="true">
          {Array.from({ length: PLACEHOLDER_CARDS }, (_, i) => (
            <div
              key={i}
              className="flex flex-col items-center rounded-[16px] border border-neutral-200 bg-white/60 p-4"
            >
              <div className="h-20 w-20 rounded-full skeleton-shimmer" />
              {/* Brand line, then the person's name underneath */}
              <div className="mt-3 h-4 w-24 rounded skeleton-shimmer" />
              <div className="mt-1.5 h-3 w-16 rounded skeleton-shimmer" />
              <div className="mt-2 h-3 w-12 rounded skeleton-shimmer" />
            </div>
          ))}
        </div>
      </div>

      <span className="sr-only">Loading creators…</span>
    </main>
  );
}
