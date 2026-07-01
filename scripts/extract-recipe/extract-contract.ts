// The extraction contract now lives in lib/recipe-extract.ts so the API route
// and this spike runner share one source of truth. Re-exported here for the
// runner's existing imports.
export {
  EXTRACT_TOOL,
  SYSTEM_PROMPT,
  USER_INSTRUCTION,
  PLANT_BASED_BRANDS,
  RARE_EXPENSIVE_INGREDIENTS,
  MODEL,
} from "../../lib/recipe-extract";
