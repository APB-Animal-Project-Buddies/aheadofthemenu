// Cuisine → surface/setting prompt fragment.
// Surfaces use materials + colors (woods, tiles, textiles), never iconic-object kitsch
// (no chopsticks-as-decor, no sombreros, no mini-flags). The camera/lighting/DOF stay
// locked across cuisines for editorial coherence — only the surface palette shifts.

export const CUISINE_SURFACES: Record<string, string> = {
  american: "warm honey-oak farmhouse table, light cream linen napkin in soft focus",
  brazilian: "weathered terracotta tile in warm clay tones, single banana leaf accent",
  caribbean: "bright turquoise glazed ceramic tile, palm-frond shadow falling across one corner",
  chinese: "dark walnut wood plank, raw silk runner in deep crimson, bamboo steamer accent",
  ethiopian: "hand-woven mesob straw mat in natural fiber, edge of injera visible at frame border",
  "fast-food": "matte cream paper liner on a brushed-steel diner counter, cleaner editorial reading of fast-casual",
  french: "honed marble bistro top in warm grey-white, single linen napkin, hint of zinc edge",
  indian: "polished brass thali on a saffron-and-indigo block-print textile, brass spoon at frame edge",
  italian: "rustic Tuscan terracotta tile in oxblood-red, sprig of fresh basil, weathered wood edge",
  japanese: "dark hinoki wood board, single charcoal-grey ceramic stone, minimalist negative space",
  korean: "dark stained oak with sesame-oil sheen, small banchan dish in matte celadon at frame edge",
  mediterranean: "weathered olive-wood board on whitewashed plaster, sprig of rosemary, soft shadow play",
  mexican: "hand-painted Talavera tile in cobalt-and-cream, terracotta clay surface accent",
  "middle-eastern": "etched brass tray on deep burgundy embroidered textile, scattered sumac in soft focus",
  spanish: "weathered olive-wood board with hammered-iron paella-pan accent, paprika-warm tones",
  thai: "fresh banana leaf glossy in soft daylight, river-stone slate accent",
  vietnamese: "fresh banana leaf on light bamboo mat, single bowl of nuoc cham at frame edge",
};

export const DEFAULT_SURFACE =
  "light raw-wood plank in cream tones, soft linen napkin, neutral editorial setting";

export function surfaceFor(cuisine: string): string {
  return CUISINE_SURFACES[cuisine?.toLowerCase()] ?? DEFAULT_SURFACE;
}
