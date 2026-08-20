/**
 * POST /api/getting-started/discard — drop a menu upload we're never going to analyse.
 *
 * The uploader starts pushing a file to Nhost storage the moment it's chosen,
 * before the user commits to scoring it. That makes the upload free in wall-clock
 * terms, but it means an object can be left behind whenever someone swaps their
 * file for a different one, or wanders off. This is the cleanup for that.
 *
 * The bucket is anonymous-write, so this endpoint has to be anonymous too. That
 * is safe here only because deleting a menu-upload is not a destructive act worth
 * protecting: the objects are write-once, ours to delete anyway the moment the
 * analysis finishes, and hold nothing but a file someone volunteered seconds ago.
 * It is bucket-scoped so it can never be pointed at dish-media.
 */
import { NextResponse } from "next/server";
import { nhost } from "@/lib/nhost";

export const dynamic = "force-dynamic";

const BUCKET = "menu-uploads";

export async function POST(request: Request) {
  let fileId = "";
  try {
    const body = await request.json();
    fileId = typeof body?.fileId === "string" ? body.fileId.trim() : "";
  } catch {
    return NextResponse.json({ error: "Send JSON { fileId }." }, { status: 400 });
  }
  if (!fileId) return NextResponse.json({ error: "Send JSON { fileId }." }, { status: 400 });
  if (!nhost.adminSecret) return NextResponse.json({ ok: true });

  try {
    // Confirm the object lives in OUR bucket before deleting. Without this the
    // endpoint would happily delete any file id in the project, dish-media
    // included — an anonymous caller must not be able to reach those.
    const meta = await fetch(`${nhost.graphqlUrl}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-hasura-admin-secret": nhost.adminSecret },
      body: JSON.stringify({
        query: `query ($id: uuid!) { file(id: $id) { id bucketId } }`,
        variables: { id: fileId },
      }),
      cache: "no-store",
    }).then((r) => r.json());

    if (meta?.data?.file?.bucketId !== BUCKET) {
      // Already gone, or not ours. Either way there's nothing for us to do —
      // and we don't tell the caller which, since that would leak file ids.
      return NextResponse.json({ ok: true });
    }

    await fetch(`${nhost.storageUrl}/files/${encodeURIComponent(fileId)}`, {
      method: "DELETE",
      headers: { "x-hasura-admin-secret": nhost.adminSecret },
    });
  } catch (e) {
    // Best effort: a stray object is cheap, and failing here would surface an
    // error for something the user never asked for.
    console.error("revamp discard failed:", (e as Error).message);
  }
  return NextResponse.json({ ok: true });
}
