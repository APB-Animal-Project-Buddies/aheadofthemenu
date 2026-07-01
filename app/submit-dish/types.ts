// Shared form-state types for the recipe intake form.
// (react-hook-form keeps numbers as strings in inputs; the API coerces them.)

// One ingredient line — shared by top-level rows and alternative lines.
export type IngredientLine = { id?: string; name: string; quantity: string; unit: string };

// An alternative is a GROUP of one-or-more lines (a swap can be several
// ingredients, e.g. 1 egg => 1 tbsp flax + 3 tbsp water) with an optional label
// and a free-text note ("roast first", "not gluten-free").
export type Alternative = { label: string; note: string; items: IngredientLine[] };

// A top-level ingredient adds an optional free-text note ("finely diced", "room
// temperature") and its nested alternatives.
export type Ingredient = IngredientLine & { note: string; alternatives: Alternative[] };

// The form nests rows under named sections for editing. On submit this flattens
// to the stored flat `ingredients` array (each row stamped with its section);
// see lib/dishes.ts buildDishData for the stored shape.
export type IngredientGroup = { section: string; items: Ingredient[] };

export type Step = { text: string };

export type RecipeFormValues = {
  title: string;
  description: string;
  cuisines: string[];
  dishType: string[];
  tags: string[];
  ingredientGroups: IngredientGroup[];
  steps: Step[];
  specialProducts: string[];
  specialEquipment: string;
  cost: string;
  servings: string;
  prepTime: string;
  allergens: string[];
  resourceLink: string;
  originalCreator: string;
  notes: string;
  name: string;
  email: string;
  triedBy: string[];
  feedback: string;
  reviewCount: string;
  rating: string;
  ratingScale: string;
};

// Factory helpers so empty rows/alternatives are created consistently.
export const emptyLine = (): IngredientLine => ({ name: "", quantity: "", unit: "" });
export const emptyIngredient = (): Ingredient => ({ name: "", quantity: "", unit: "", note: "", alternatives: [] });
export const emptyAlternative = (): Alternative => ({ label: "", note: "", items: [emptyLine()] });

export const RECIPE_FORM_DEFAULTS: RecipeFormValues = {
  title: "", description: "", cuisines: [], dishType: [], tags: [],
  // One unnamed section with a handful of rows open, so a simple recipe looks
  // exactly like before (no section header shown until a 2nd section is added).
  ingredientGroups: [{ section: "", items: Array.from({ length: 5 }, emptyIngredient) }],
  steps: Array.from({ length: 3 }, () => ({ text: "" })),
  specialProducts: [], specialEquipment: "", cost: "", servings: "", prepTime: "", allergens: [],
  resourceLink: "", originalCreator: "", notes: "",
  name: "", email: "", triedBy: [], feedback: "", reviewCount: "", rating: "", ratingScale: "5",
};
