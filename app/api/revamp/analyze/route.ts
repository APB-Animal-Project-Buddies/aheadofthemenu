/**
 * POST /api/revamp/analyze — score an uploaded menu against the eight moves.
 *
 * Open to everyone: no sign-in, no account, no quota, nothing stored. A visitor
 * uploads a menu, the model scores it, the scorecard comes straight back in the
 * response and is never persisted.
 *
 * NOTE: this endpoint spends Anthropic credit on every call and is deliberately
 * unmetered, so the only thing standing between it and a runaway bill is the
 * spend cap on the Anthropic account. If that becomes a problem, the cheapest
 * fix is a per-IP limit here (or a Vercel WAF rate rule) rather than a login.
 *
 * Multipart body: `menu` = the PDF or photo.
 */
import { NextResponse } from "next/server";
import { analyseMenu, MenuInputError, MenuTooLargeError } from "@/lib/menu-revamp";
import { nhost } from "@/lib/nhost";

export const dynamic = "force-dynamic";
// Vision + adaptive thinking over a full menu runs well past the 60s we allow
// the recipe parser. Needs a Vercel plan that permits it; the model call is
// streamed so the connection stays alive throughout.
export const maxDuration = 300;

// Vercel caps a serverless function's REQUEST BODY at ~4.5 MB, and that check
// runs on the platform before this handler is ever invoked — so a larger cap
// here would be a lie: the user would get an opaque platform 413 instead of our
// message. Kept just under the ceiling to leave room for multipart overhead.
// (Outbound requests FROM the function are not capped — which is why the fix for
// genuinely large menus is a direct-to-storage upload plus the Files API, not a
// bigger number here.)
const MAX_FILE_BYTES = 4 * 1024 * 1024; // 4 MB

/**
 * Ceiling for the storage path. Matches the menu-uploads bucket's own 15MB cap,
 * so a file Nhost accepted can always be fetched here — the bucket is the real
 * enforcement point; this is a second line of defence against a huge download.
 */
const MAX_STORED_BYTES = 15 * 1024 * 1024;

/**
 * Pulls an uploaded object out of Nhost storage with the admin secret.
 *
 * This is the whole point of the storage hop: the bytes arrive over an OUTBOUND
 * request, which Vercel does not size-cap, so a 40-page menu that could never
 * fit through this function's 4.5MB request body gets here fine.
 */
async function fetchStoredFile(fileId: string): Promise<Uint8Array> {
  if (!nhost.adminSecret) throw new Error("NHOST_GRAPHQL_SECRET is not set on the server");

  const res = await fetch(`${nhost.storageUrl}/files/${encodeURIComponent(fileId)}`, {
    headers: { "x-hasura-admin-secret": nhost.adminSecret },
    cache: "no-store",
  });
  if (!res.ok) throw new MenuInputError("We couldn't find that upload. Please try uploading again.");

  // Trust the header when present, but still bound the actual read: a wrong or
  // absent Content-Length must not let an oversized body through.
  const declared = Number(res.headers.get("content-length") ?? 0);
  if (declared > MAX_STORED_BYTES) {
    throw new MenuTooLargeError("That file is too large to analyse. Please upload a smaller menu.");
  }
  const buf = new Uint8Array(await res.arrayBuffer());
  if (buf.byteLength > MAX_STORED_BYTES) {
    throw new MenuTooLargeError("That file is too large to analyse. Please upload a smaller menu.");
  }
  return buf;
}

/** Deletes the storage object once we're done — menus aren't ours to keep. */
async function deleteStoredFile(fileId: string): Promise<void> {
  if (!nhost.adminSecret) return;
  await fetch(`${nhost.storageUrl}/files/${encodeURIComponent(fileId)}`, {
    method: "DELETE",
    headers: { "x-hasura-admin-secret": nhost.adminSecret },
  }).catch(() => { /* best effort — a stray object is not worth failing the analysis over */ });
}

export async function POST(request: Request) {
  const ctype = request.headers.get("content-type") ?? "";

  let bytes: Uint8Array;
  // The storage object to clean up afterwards, if the caller used that path.
  let storedFileId: string | null = null;

  try {
    if (ctype.includes("application/json")) {
      // Preferred path: the browser uploaded straight to Nhost storage and sends
      // us only the id, so the file never passes through Vercel's 4.5MB body cap.
      const body = await request.json();
      const fileId = typeof body?.fileId === "string" ? body.fileId.trim() : "";
      if (!fileId) {
        return NextResponse.json({ error: "Provide the uploaded file's 'fileId'." }, { status: 400 });
      }
      storedFileId = fileId;
      bytes = await fetchStoredFile(fileId);
    } else if (ctype.includes("multipart/form-data")) {
      // Direct path, kept for small files: one less round trip than uploading to
      // storage first. Bounded by what Vercel will even deliver to us.
      const form = await request.formData();
      const file = form.get("menu");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "No menu file was received. Choose a PDF or photo." }, { status: 400 });
      }
      if (file.size === 0) {
        return NextResponse.json({ error: "That file is empty." }, { status: 400 });
      }
      if (file.size > MAX_FILE_BYTES) {
        return NextResponse.json(
          {
            error:
              "That file is over 4 MB. Photos: retake at a lower resolution. PDFs: upload just the food pages.",
          },
          { status: 413 }
        );
      }
      bytes = new Uint8Array(await file.arrayBuffer());
    } else {
      return NextResponse.json(
        { error: "Send JSON { fileId } after uploading, or multipart/form-data with a 'menu' file." },
        { status: 415 }
      );
    }
  } catch (e) {
    if (storedFileId) await deleteStoredFile(storedFileId);
    if (e instanceof MenuInputError) return NextResponse.json({ error: e.message }, { status: 422 });
    if (e instanceof MenuTooLargeError) return NextResponse.json({ error: e.message }, { status: 413 });
    console.error("revamp: could not read the upload:", (e as Error).message);
    return NextResponse.json({ error: "Could not read the upload." }, { status: 400 });
  }

  try {
    const { scorecard, model } = await analyseMenu(bytes);
    return NextResponse.json({ ok: true, scorecard, model });
  } catch (e) {
    // MenuInputError = the upload itself is the problem (not a menu, unreadable,
    // unsupported type). Everything else is ours and shouldn't blame the user.
    if (e instanceof MenuInputError) {
      return NextResponse.json({ error: e.message }, { status: 422 });
    }
    // 413: the menu is fine, there's just too much of it for one pass.
    if (e instanceof MenuTooLargeError) {
      return NextResponse.json({ error: e.message }, { status: 413 });
    }
    const msg = (e as Error).message || "Analysis failed";
    console.error("revamp analysis failed:", msg);
    return NextResponse.json(
      { error: "We couldn't analyse that menu right now. Please try again." },
      { status: /ANTHROPIC_API_KEY/.test(msg) ? 500 : 502 }
    );
  } finally {
    // The menu is the restaurant's, not ours. Drop it as soon as we're done —
    // which also keeps the bucket's public-read window down to seconds.
    if (storedFileId) await deleteStoredFile(storedFileId);
  }
}
