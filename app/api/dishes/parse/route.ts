import { NextResponse } from "next/server";
import { extractRecipeDraft } from "@/lib/recipe-extract";

// One recipe per request. Upload a single file (PDF / docx / image / text) as
// multipart `file`, or POST JSON { text, filename? }. The server calls Claude
// (key stays server-side) and returns a form-shaped draft for the frontend to
// prefill. Bulk / multi-recipe documents are intentionally not supported.

export const dynamic = "force-dynamic";
export const maxDuration = 60; // model call can take a few seconds

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(request: Request) {
  const ctype = request.headers.get("content-type") ?? "";
  let bytes: Uint8Array | undefined;
  let filename: string | undefined;
  let mediaType: string | undefined;
  let text: string | undefined;

  try {
    if (ctype.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "Attach a single recipe file as 'file'." }, { status: 400 });
      }
      if (file.size > MAX_FILE_BYTES) {
        return NextResponse.json({ error: "File too large (max 10 MB)." }, { status: 413 });
      }
      bytes = new Uint8Array(await file.arrayBuffer());
      filename = file.name;
      mediaType = file.type;
    } else if (ctype.includes("application/json")) {
      const body = await request.json();
      if (typeof body?.text !== "string" || !body.text.trim()) {
        return NextResponse.json({ error: "Provide non-empty 'text', or upload a file." }, { status: 400 });
      }
      text = body.text;
      filename = typeof body?.filename === "string" ? body.filename : undefined;
    } else {
      return NextResponse.json(
        { error: "Send multipart/form-data with a 'file', or JSON { text }." },
        { status: 415 }
      );
    }
  } catch {
    return NextResponse.json({ error: "Could not read the upload." }, { status: 400 });
  }

  try {
    const { draft, usage, model } = await extractRecipeDraft({ filename, mediaType, bytes, text });
    return NextResponse.json({ ok: true, draft, model, usage });
  } catch (e) {
    const msg = (e as Error).message || "Extraction failed";
    // missing key => our config (500); upstream model error => 502; bad input => 422
    const status = /ANTHROPIC_API_KEY/.test(msg) ? 500 : /Claude API/.test(msg) ? 502 : 422;
    if (status >= 500) console.error("recipe parse failed:", msg);
    return NextResponse.json({ error: status >= 500 ? "Could not parse the recipe right now." : msg }, { status });
  }
}
