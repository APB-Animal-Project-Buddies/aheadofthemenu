"use client";

// /recipes — the business-side entry to the dish library. It renders the same
// page as /dishes, but at its own URL so the emerald nav stays in business mode
// and the "Recipes" tab highlights. It used to be a redirect to /dishes, which
// dropped the #business fragment and flipped the whole bar to the consumer tabs
// the moment a chef/creator clicked Recipes.
export { default } from "@/app/dishes/page";
