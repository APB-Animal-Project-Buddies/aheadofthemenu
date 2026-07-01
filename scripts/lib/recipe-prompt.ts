import { surfaceFor } from "./cuisine-surfaces";

export interface Recipe {
  id: string;
  title: string;
  cuisine: string;
  cuisineName?: string;
  courses?: string[];
  description?: string;
  photo?: string;
  photoLabel?: string;
  [k: string]: unknown;
}

const PLATING_BY_PHOTO_TOKEN: Record<string, string> = {
  bowl: "served in a deep ceramic bowl",
  plate: "plated on a wide-rim ceramic plate",
  layered: "tall layered presentation, height visible",
  platter: "arranged on a shared platter",
  skillet: "served straight from a cast-iron skillet",
  stack: "stacked vertically with structural intent",
  taco: "in a soft tortilla, fillings visible from the side",
  wrap: "wrapped, cross-section visible at one end",
  noodle: "twirled noodles centered, broth glossy",
  rice: "rice base with toppings arranged radially",
  flatbread: "on a charred flatbread, components scattered",
  mezze: "small plates clustered like a mezze spread",
  salad: "loosely composed salad, greens lifted",
};

function platingFor(photoToken?: string): string {
  if (!photoToken) return "plated on a ceramic plate";
  return PLATING_BY_PHOTO_TOKEN[photoToken.toLowerCase()] ?? "plated on a ceramic plate";
}

function primaryCourse(recipe: Recipe): string {
  const c = recipe.courses?.[0];
  if (!c) return "dish";
  return c;
}

/**
 * Strip operations-only sentences (cost, prep time, fast-service tags) from a
 * recipe description so they don't leak into the prompt as non-visual noise.
 * Keep visual sentences (ingredients, plating, color, texture).
 */
function visualDescription(description: string): string {
  if (!description) return "";
  // Split on sentence-ish boundaries; drop anything that's pure operations data.
  const opsRe = /(par-cook|bulk-prep|fast-service|per-plate|menu price|serve\b|easy\s*—|medium\s*—|hard\s*—|\d+\s*(min|m\b)|\$\d)/i;
  const parts = description.split(/(?<=[.!?])\s+/).filter((s) => s && !opsRe.test(s));
  return parts.join(" ").trim();
}

/**
 * Drop the recipe-source attribution suffix (e.g. " — Okonomi Kitchen") so the
 * prompt focuses on the dish, not the blog name.
 */
function cleanTitle(title: string): string {
  return title.replace(/\s+—\s+[^—]+$/, "").trim();
}

function articleFor(word: string): string {
  return /^[aeiouAEIOU]/.test(word) ? "an" : "a";
}

export function buildPrompt(recipe: Recipe): string {
  const cuisineName = recipe.cuisineName ?? recipe.cuisine;
  const description = visualDescription(recipe.description ?? "");
  const plating = platingFor(recipe.photo);
  const surface = surfaceFor(recipe.cuisine);

  return [
    `Photoreal food photography, modern cookbook style.`,
    `${cleanTitle(recipe.title)} — ${articleFor(cuisineName)} ${cuisineName} ${primaryCourse(recipe)}.`,
    description,
    `Plating: ${plating}.`,
    `Strict requirement: 100% plant-based — no meat, no dairy, no eggs, no honey, no fish, no animal products.`,
    `Composition: 3/4 overhead angle, soft diffused natural daylight from upper-left, shallow depth of field, dish centered, 4:3 aspect.`,
    `Surface and setting: ${surface}.`,
    `Background: blurred, neutral, no logos, no text, no humans, no hands, no extra utensils outside frame.`,
    `Mood: editorial, restaurant-grade, appetite-led. Natural color, no oversaturation. No cartoon, no illustration, no AI artifacts.`,
  ]
    .filter(Boolean)
    .join(" ");
}
