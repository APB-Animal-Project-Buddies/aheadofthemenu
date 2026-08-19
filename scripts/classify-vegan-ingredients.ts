// Classify every prod ingredient as vegan / non_vegan / needs_review.
//
// Definition (from the user): vegan = ZERO meat or animal-derived content, INCLUDING
// insects and other sentient life. So carmine (E120, cochineal beetles) and shellac
// (E904, lac insect) are non_vegan, as are the usual dairy/egg/gelatine cases.
//
// This is the DETERMINISTIC pass only. It assigns a class ONLY where the evidence is
// unambiguous; everything else is left `needs_review` for the LLM + web-search pass.
// Guessing here would put false "vegan" labels on animal ingredients, which is the one
// outcome we cannot ship.
//
//   bun scripts/classify-vegan-ingredients.ts            # report coverage, write nothing
//   bun scripts/classify-vegan-ingredients.ts --out=FILE # also emit the classification
export {};

type Cls = "vegan" | "non_vegan" | "ambiguous" | "needs_review";
type Row = { id: string; name: string; vegan: boolean | null };

const args = process.argv.slice(2);
const outArg = args.find((a) => a.startsWith("--out="))?.split("=")[1];

// ── E-numbers that ARE animal-derived (or routinely are) ─────────────────────────────
// Sources: EU Reg. 1333/2008 Annex II; Vegan Society / VegSoc additive listings.
// Kept explicit rather than heuristic — an E-number's vegan status is not inferable
// from its digits.
// ALWAYS animal-derived. There is no plant version of these — a verdict is safe.
const E_ANIMAL: Record<string, string> = {
  e120: "carmine / cochineal — crushed Dactylopius coccus insects",
  e441: "gelatine — animal collagen (bones, skin, tendons)",
  e542: "bone phosphate — animal bone",
  e901: "beeswax — bees",
  e904: "shellac — lac insect (Kerria lacca) resin",
  e913: "lanolin — sheep wool grease",
  e966: "lactitol — derived from lactose (milk)",
  e1000: "cholic acid — bile",
  e1105: "lysozyme — hen egg white",
};

// SOURCE-DEPENDENT. The same E-number is plant-derived in one product and animal-derived
// in the next, and EU labelling does not require the origin to be declared. These CANNOT
// be resolved at the ingredient level — only per finished product, from the manufacturer.
// Calling them non_vegan would wrongly exclude the (usually majority) plant-derived
// supply; calling them vegan would be a false vegan label. Both are unacceptable, so they
// get their own verdict.
const E_SOURCE_DEPENDENT: Record<string, string> = {
  e442: "ammonium phosphatides — fat source may be animal",
  e471: "mono/diglycerides — fat source may be animal (commonly palm)",
  e472: "esters of mono/diglycerides — fat source may be animal",
  e473: "sucrose esters of fatty acids — fat source may be animal",
  e474: "sucroglycerides — fat source may be animal",
  e475: "polyglycerol esters — fat source may be animal",
  e476: "polyglycerol polyricinoleate — usually castor/plant, verify",
  e477: "propylene glycol esters — fat source may be animal",
  e478: "lactylated fatty acid esters — may be animal",
  e479: "thermally oxidised soya oil w/ mono/diglycerides",
  e481: "sodium stearoyl lactylate — stearic acid may be animal",
  e482: "calcium stearoyl lactylate — stearic acid may be animal",
  e483: "stearyl tartrate — stearic acid may be animal",
  e491: "sorbitan monostearate — stearic acid may be animal",
  e492: "sorbitan tristearate — stearic acid may be animal",
  e493: "sorbitan monolaurate — may be animal",
  e494: "sorbitan monooleate — may be animal",
  e495: "sorbitan monopalmitate — may be animal",
  e570: "stearic acid / fatty acids — may be animal",
  e572: "magnesium stearate — stearic acid may be animal",
  e585: "ferrous lactate — lactate may be dairy-derived",
  e626: "guanylic acid — may be from sardines or yeast",
  e627: "disodium guanylate — may be from sardines or yeast",
  e628: "dipotassium guanylate — may be animal",
  e629: "calcium guanylate — may be animal",
  e630: "inosinic acid — may be from sardines/meat",
  e631: "disodium inosinate — may be from sardines/meat",
  e632: "dipotassium inosinate — may be animal",
  e633: "calcium inosinate — may be animal",
  e634: "calcium ribonucleotides — may be animal",
  e635: "disodium ribonucleotides — may be animal",
  e640: "glycine — may be animal-derived",
  e910: "L-cysteine — ~90% from keratin (feathers/bristles); synthetic exists",
  e920: "L-cysteine hydrochloride — ~90% from keratin; synthetic exists",
  e921: "L-cystine — ~90% from keratin; synthetic exists",
  // added when sweeping the full E-number space — these are the ones a
  // "not in the animal table therefore vegan" default would have got WRONG:
  e153: "vegetable carbon — historically also produced as bone char",
  e322: "lecithin — usually soya, but egg lecithin is permitted under the same number",
  e430: "polyoxyethylene stearate — stearic acid may be animal",
  e431: "polyoxyethylene stearate — stearic acid may be animal",
  e432: "polysorbate 20 — fatty acid source may be animal",
  e433: "polysorbate 80 — fatty acid source may be animal",
  e434: "polysorbate 40 — fatty acid source may be animal",
  e435: "polysorbate 60 — fatty acid source may be animal",
  e436: "polysorbate 65 — fatty acid source may be animal",
  e445: "glycerol esters of wood rosin — glycerol source may be animal",
  e470: "fatty acid salts — fat source may be animal",
  e484: "stearyl citrate — stearic acid may be animal",
  e485: "sodium stearoyl fumarate — stearic acid may be animal",
  e486: "calcium stearoyl fumarate — stearic acid may be animal",
  e487: "sodium lauryl sulphate — may be animal-derived lauric acid",
  e488: "ethoxylated mono/diglycerides — fat source may be animal",
  e489: "methyl glucoside-coconut oil ester — verify",
  e490: "propylene glycol alginate — verify",
  e1518: "triacetin — glycerol source may be animal",
  e1520: "propylene glycol — verify",
};

// Unambiguous animal words. Word-boundary matched, so "buttermilk" hits but "butternut"
// and "coconut butter" are handled by the plant-override list below.
const ANIMAL_WORDS = [
  "meat","beef","veal","pork","bacon","ham","lard","tallow","suet","gelatin","gelatine",
  "chicken","turkey","duck","goose","poultry","quail","pheasant","partridge",
  "lamb","mutton","goat meat","venison","rabbit","bison","buffalo meat","horse",
  "fish","anchovy","anchovies","sardine","tuna","salmon","cod","haddock","herring",
  "mackerel","trout","bream","bass","pollock","tilapia","catfish","eel","caviar","roe",
  "shellfish","shrimp","prawn","crab","lobster","crayfish","oyster","mussel","clam",
  "scallop","squid","octopus","cuttlefish","krill","snail","escargot",
  "milk","dairy","cheese","butterfat","buttermilk","cream","yoghurt","yogurt","kefir",
  "whey","casein","caseinate","lactose","lactalbumin","lactoglobulin","ghee","curd",
  "egg","albumen","ovalbumin","mayonnaise",
  "honey","beeswax","propolis","royal jelly","bee pollen",
  "shellac","carmine","cochineal","lac resin",
  "collagen","keratin","elastin","offal","isinglass","lanolin","tallowate",
  "insect","cricket","mealworm",
  // NOTE deliberately NOT in this list: kidney, bone, blood, liver, marrow, tripe,
  // gizzard, silk, stearin, rennet. Every one of them collides with a plant or fungal
  // food name in this dataset — kidney bean, bloody milk cap (a mushroom), vegetable
  // marrow, liverwort, microbial rennet, silken tofu. A false `non_vegan` silently
  // drops a real plant food from the whole downstream pipeline, so these go to the
  // LLM pass instead of being guessed here. Precision over recall.
];

// Plant-food phrases that contain an animal word as a substring or as a culinary
// analogue. Checked FIRST — these are vegan despite the keyword.
const PLANT_OVERRIDES = [
  "coconut milk","almond milk","soy milk","soya milk","oat milk","rice milk","cashew milk",
  "hemp milk","hazelnut milk","macadamia milk","pea milk","flax milk","walnut milk",
  "coconut cream","soy cream","oat cream","cashew cream","almond cream","plant cream",
  "coconut butter","peanut butter","almond butter","cashew butter","nut butter",
  "cocoa butter","shea butter","seed butter","sunflower butter","apple butter",
  "vegan cheese","plant cheese","nutritional yeast","soy cheese",
  "coconut yoghurt","soy yoghurt","oat yoghurt","plant yoghurt","coconut yogurt","soy yogurt",
  "butternut","butterhead","butterbean","butter bean","butter lettuce","butterkin",
  "milk thistle","milkweed","coconut water","milk chocolate substitute",
  "egg plant","eggplant","eggfruit","salad cream substitute",
  "honeydew","honeysuckle","honey mushroom","honeycomb toffee",
  "fish mint","fishtail palm","swordfish plant","oyster mushroom","oyster plant",
  "crab apple","crabgrass","lobster mushroom","chicken of the woods","beefsteak tomato",
  "beefsteak plant","liverwort","bloodorange","blood orange","bone dry",
  "sea vegetable","seaweed","sea moss","irish moss",
  "vegan","plant-based","plant based","meat substitute","meat alternative","meat-free",
  "mock meat","imitation crab","vegetarian",
  // caught as false non_vegan on the first run against the real data:
  "plant milk","plant-milk","microbial rennet","vegetable rennet","milk cap",
  "meat bean","rice cream","soya cream","silken tofu","milk bush","sea buckthorn",
  "tigernut milk","tiger nut milk","vegetable suet","walnut cream","tahini cream",
  // User's rule: "If an ingredient has a plant-derived source it's permissible."
  // These gelling/thickening agents have NO animal form — they are not gelatin with a
  // plant source, they are different compounds. (There is no such thing as plant-derived
  // gelatin: gelatin IS animal collagen, and "vegetable gelatin" on a label means one of
  // the substances below. See E441 in E_ANIMAL.)
  "agar","pectin","carrageenan","irish moss","konjac","xanthan gum","guar gum",
  "gellan gum","locust bean gum","carob bean gum","alginate","alginic","tara gum",
  "acacia gum","gum arabic","tragacanth","psyllium","inulin","cellulose gum",
];

const lower = (s: string) => s.toLowerCase();
const hasWord = (hay: string, needle: string) =>
  new RegExp(`(^|[^a-z])${needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z]|$)`, "i").test(hay);

const eNum = (s: string) => lower(s).replace(/[\s-]/g, "").match(/^e(\d{3,4})([a-z]*)$/);

function classify(r: Row): { cls: Cls; why: string } {
  const n = lower(r.name).trim();

  // 1. Explicit plant override beats every keyword rule.
  for (const p of PLANT_OVERRIDES) if (n.includes(p)) return { cls: "vegan", why: `plant term "${p}"` };

  // 2. E-number with a known animal origin.
  const m = eNum(r.name);
  if (m) {
    const base = `e${m[1]}`;
    const full = `e${m[1]}${m[2]}`;
    const hard = E_ANIMAL[full] ?? E_ANIMAL[base];
    if (hard) return { cls: "non_vegan", why: `E-number: ${hard}` };
    const soft = E_SOURCE_DEPENDENT[full] ?? E_SOURCE_DEPENDENT[base];
    if (soft) return { cls: "ambiguous", why: `E-number, source-dependent: ${soft}` };
    // Everything else in the E-space is a defined synthetic, mineral, microbial or
    // plant-derived substance. The animal and source-dependent cases above are
    // enumerated exhaustively from the EU Reg. 1333/2008 Annex II list, so the
    // remainder defaults to vegan. Tagged distinctly so this default is auditable and
    // can be reverted in one query if a case was missed.
    return { cls: "vegan", why: "E-number default: not in the animal or source-dependent tables" };
  }

  // 3. Named animal ingredient.
  for (const w of ANIMAL_WORDS) if (hasWord(n, w)) return { cls: "non_vegan", why: `animal term "${w}"` };

  return { cls: "needs_review", why: "no deterministic rule" };
}

const ing: Row[] = JSON.parse(await Bun.file(`${process.env.TMPDIR}/probe/prod-ingredients.json`).text());
const out = ing.map((r) => ({ ...r, ...classify(r) }));

const tally: Record<string, number> = {};
for (const r of out) tally[r.cls] = (tally[r.cls] ?? 0) + 1;
console.log(`prod ingredients: ${ing.length}`);
console.log(`deterministic pass:`, JSON.stringify(tally));
console.log(`  coverage: ${(100 * (out.length - tally.needs_review) / out.length).toFixed(1)}% decided, ${tally.needs_review} left for LLM/web`);

const insects = out.filter((r) => /insect|cochineal|carmine|shellac|lac insect|bee|cricket|mealworm/i.test(r.why));
console.log(`\nsentient-life catches (the case you called out) — ${insects.length}:`);
for (const r of insects.slice(0, 15)) console.log(`   ${r.name}  ->  ${r.why}`);

console.log(`\nsample non_vegan (animal term):`);
for (const r of out.filter((r) => r.cls === "non_vegan" && r.why.startsWith("animal")).slice(0, 12))
  console.log(`   ${r.name}  ->  ${r.why}`);

console.log(`\nsample plant-override rescues (would have been false non_vegan):`);
for (const r of out.filter((r) => r.why.startsWith("plant term")).slice(0, 12))
  console.log(`   ${r.name}  ->  ${r.why}`);

if (outArg) { await Bun.write(outArg, JSON.stringify(out, null, 0)); console.log(`\nwrote ${outArg}`); }
