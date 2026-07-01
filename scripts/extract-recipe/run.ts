// Spike runner: read a recipe document, extract structured fields via Claude
// using the forced tool call in extract-contract.ts, and pretty-print the result.
//
// Usage:
//   ANTHROPIC_API_KEY=sk-... bun run scripts/extract-recipe/run.ts "<path to .docx | .txt>"
//
// Self-contained (raw fetch, no SDK dep). For productionizing we'd switch to
// @anthropic-ai/sdk; this is a throwaway to judge extraction quality.

import { EXTRACT_TOOL, SYSTEM_PROMPT, USER_INSTRUCTION } from "./extract-contract";

// Flip this to compare models on the same document.
const MODEL = process.env.MODEL ?? "claude-haiku-4-5"; // or "claude-opus-4-8"

const API_KEY = process.env.ANTHROPIC_API_KEY;
if (!API_KEY) {
  console.error("Set ANTHROPIC_API_KEY (e.g. from grassroots-web's .env).");
  process.exit(1);
}

const path = process.argv[2];
if (!path) {
  console.error('Pass a file path, e.g. bun run scripts/extract-recipe/run.ts "~/Downloads/recipe.docx"');
  process.exit(1);
}

// --- 1. Get plain text out of the document ---------------------------------
async function extractText(file: string): Promise<string> {
  if (file.toLowerCase().endsWith(".docx")) {
    // A .docx is a zip; the body lives in word/document.xml. Turn paragraph
    // boundaries into newlines and strip the XML tags.
    const xml = await Bun.$`unzip -p ${file} word/document.xml`.text();
    return xml
      .replace(/<\/w:p>/g, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/\n{2,}/g, "\n")
      .trim();
  }
  // .txt / .md / anything plain
  return (await Bun.file(file).text()).trim();
}

const docText = await extractText(path.replace(/^~/, process.env.HOME ?? "~"));
console.log(`\n📄 Extracted ${docText.length} chars from ${path}\n   model: ${MODEL}\n`);

// --- 2. Force the extraction tool ------------------------------------------
const res = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: {
    "x-api-key": API_KEY,
    "anthropic-version": "2023-06-01",
    "content-type": "application/json",
  },
  body: JSON.stringify({
    model: MODEL,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    tools: [EXTRACT_TOOL],
    tool_choice: { type: "tool", name: EXTRACT_TOOL.name },
    messages: [
      {
        role: "user",
        content:
          `${USER_INSTRUCTION}\n\n` +
          // The document body often omits the title — the filename frequently carries
          // it (and a cuisine signal). Provide it, but it's only a hint.
          `Document filename (may hint at title/cuisine): ${path.split("/").pop()}\n\n` +
          `---\n${docText}`,
      },
    ],
  }),
});

if (!res.ok) {
  console.error(`API error ${res.status}:`, await res.text());
  process.exit(1);
}

const json: any = await res.json();
const toolUse = json.content?.find((b: any) => b.type === "tool_use" && b.name === EXTRACT_TOOL.name);
if (!toolUse) {
  console.error("No tool call returned. Raw response:\n", JSON.stringify(json, null, 2));
  process.exit(1);
}
const r = toolUse.input;

// --- 3. Format, print, and SAVE --------------------------------------------
const line = "─".repeat(60);
const out: string[] = [];
const p = (s = "") => out.push(s);

p(line);
p(`TITLE       ${r.title ?? "—"}`);
p(`CUISINES    ${(r.cuisines ?? []).join(", ") || "—"}`);
p(`DISH TYPE   ${(r.dishType ?? []).join(", ") || "—"}`);
p(`TAGS        ${(r.tags ?? []).join(", ") || "—"}`);
p(`DESCRIPTION ${r.description ?? "—"}`);
p(line);
p("INGREDIENTS");
for (const ing of r.ingredients ?? []) {
  const qty = [ing.quantity, ing.unit].filter((x: any) => x != null && x !== "").join(" ");
  const prep = ing.preparation ? `  (${ing.preparation})` : "";
  p(`  • ${(qty || "—").padEnd(12)} ${ing.name}${prep}`);
  p(`      ↳ raw: ${ing.raw}`);
}
p(line);
p("STEPS");
(r.steps ?? []).forEach((s: string, i: number) => p(`  ${i + 1}. ${s}`));
p(line);
p(`ALLERGENS (inferred)   ${(r.allergens ?? []).join(", ") || "—"}`);
p(`SPECIAL PRODUCTS       ${r.specialProducts ?? "—"}`);
p(`SPECIAL EQUIPMENT      ${r.specialEquipment ?? "—"}`);
p(`ORIGINAL CREATOR       ${r.originalCreator ?? "—"}`);
p(`RESOURCE LINK          ${r.resourceLink ?? "—"}`);
p(`NOTES                  ${r.notes ?? "—"}`);
p(line);
p(`\n(model: ${MODEL} · usage: ${json.usage?.input_tokens} in / ${json.usage?.output_tokens} out)`);

const pretty = out.join("\n");
console.log(pretty);

// Persist both the human-readable view and the raw JSON so it can be reviewed later.
const base = (path.split("/").pop() ?? "result").replace(/\.[^.]+$/, "");
const dir = `${import.meta.dir}/out`;
await Bun.write(`${dir}/${base}.txt`, pretty + "\n");
await Bun.write(`${dir}/${base}.json`, JSON.stringify({ model: MODEL, usage: json.usage, result: r }, null, 2));
console.log(`\n💾 saved → scripts/extract-recipe/out/${base}.txt  (and .json)\n`);
