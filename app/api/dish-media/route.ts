/**
 * Recipe gallery API.
 *
 *   GET    /api/dish-media?dishId=15          (public) -> { items: [...] }
 *   POST   /api/dish-media                    (Bearer) { dishId, fileId, caption? }
 *   DELETE /api/dish-media                    (Bearer) { id }   (uploader only)
 *
 * The browser uploads the file itself straight to Nhost storage (bucket
 * 'dish-media', user-role permission), then POSTs here to register it against
 * a dish. We validate the file server-side — it must live in the dish-media
 * bucket and be an image/* or video/* — so the gallery can't reference
 * arbitrary files. Deleting removes the storage object; the dish_media row
 * follows via the file_id ON DELETE CASCADE.
 */
import { NextRequest, NextResponse } from "next/server";
import { graphql, nhost } from "@/lib/nhost";
import { verifyNhostJwt, bearerToken } from "@/lib/jwt";

export const dynamic = "force-dynamic";
// Nhost can be slow after idle (cold start); the default function timeout killed
// requests mid-mutation — Hasura had already committed, so the client saw a
// "network error" yet the write succeeded. 60s lets the function wait it out.
export const maxDuration = 60;

type MediaRow = {
  id: string;
  dish_id: number;
  file_id: string;
  uploader_id: string | null;
  kind: "image" | "video";
  caption: string | null;
  position: number;
};

const fileUrl = (fileId: string) => `${nhost.storageUrl}/files/${fileId}`;

export async function GET(request: NextRequest) {
  const dishId = Number(new URL(request.url).searchParams.get("dishId"));
  if (!Number.isInteger(dishId)) return NextResponse.json({ error: "Missing dishId" }, { status: 400 });
  try {
    const res = await graphql<{ dish_media: MediaRow[] }>(
      `query ($dishId: Int!) {
         dish_media(
           where: { dish_id: { _eq: $dishId } }
           order_by: [{ position: asc }, { created_at: asc }]
         ) { id dish_id file_id uploader_id kind caption position }
       }`,
      { useAdminSecret: true, variables: { dishId } }
    );
    if (res.errors?.length) throw new Error(res.errors[0].message);
    const items = (res.data?.dish_media ?? []).map((m) => ({ ...m, url: fileUrl(m.file_id) }));
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ error: "Temporarily unavailable" }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  const caller = verifyNhostJwt(bearerToken(request.headers.get("authorization")));
  if (!caller) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const dishId = Number(body?.dishId);
  const fileId = String(body?.fileId ?? "").trim();
  const caption = typeof body?.caption === "string" ? body.caption.slice(0, 300) : null;
  if (!Number.isInteger(dishId) || !fileId) {
    return NextResponse.json({ error: "Missing dishId or fileId" }, { status: 400 });
  }

  try {
    // The uploaded file must be in our gallery bucket, finished uploading, and
    // actually an image or video — its mime type decides the gallery kind.
    const fileRes = await graphql<{ file: { bucketId: string; mimeType: string | null; isUploaded: boolean } | null }>(
      `query ($id: uuid!) { file(id: $id) { bucketId mimeType isUploaded } }`,
      { useAdminSecret: true, variables: { id: fileId } }
    );
    if (fileRes.errors?.length) throw new Error(fileRes.errors[0].message);
    const file = fileRes.data?.file;
    if (!file || file.bucketId !== "dish-media" || !file.isUploaded) {
      return NextResponse.json({ error: "File not found in the gallery bucket." }, { status: 404 });
    }
    const mime = file.mimeType ?? "";
    const kind = mime.startsWith("video/") ? "video" : mime.startsWith("image/") ? "image" : null;
    if (!kind) return NextResponse.json({ error: "Only images and videos are allowed." }, { status: 415 });

    const ins = await graphql<{ insert_dish_media_one: { id: string } | null }>(
      `mutation ($dishId: Int!, $fileId: uuid!, $uid: uuid!, $kind: String!, $caption: String) {
         insert_dish_media_one(object: {
           dish_id: $dishId, file_id: $fileId, uploader_id: $uid, kind: $kind, caption: $caption
         }) { id }
       }`,
      { useAdminSecret: true, variables: { dishId, fileId, uid: caller.userId, kind, caption } }
    );
    if (ins.errors?.length) throw new Error(ins.errors[0].message);
    const id = ins.data?.insert_dish_media_one?.id;
    if (!id) throw new Error("insert failed");
    return NextResponse.json({ ok: true, id, kind, url: fileUrl(fileId) });
  } catch {
    return NextResponse.json({ error: "Couldn't add that to the gallery." }, { status: 502 });
  }
}

export async function DELETE(request: NextRequest) {
  const caller = verifyNhostJwt(bearerToken(request.headers.get("authorization")));
  if (!caller) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const id = String(body?.id ?? "").trim();
  const rawFileId = String(body?.fileId ?? "").trim();
  if (!id && !rawFileId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  try {
    // {fileId}: a staged upload that was never registered against a dish
    // (e.g. picked on the submit form, then removed before submitting). Only
    // its own uploader may discard it.
    if (!id && rawFileId) {
      const f = await graphql<{ file: { uploadedByUserId: string | null } | null }>(
        `query ($id: uuid!) { file(id: $id) { uploadedByUserId } }`,
        { useAdminSecret: true, variables: { id: rawFileId } }
      );
      if (f.errors?.length) throw new Error(f.errors[0].message);
      if (!f.data?.file) return NextResponse.json({ error: "Not found" }, { status: 404 });
      if (f.data.file.uploadedByUserId !== caller.userId) {
        return NextResponse.json({ error: "You can only remove your own uploads." }, { status: 403 });
      }
      const del = await fetch(`${nhost.storageUrl}/files/${rawFileId}`, {
        method: "DELETE",
        headers: { "x-hasura-admin-secret": nhost.adminSecret ?? "" },
      });
      if (!del.ok) throw new Error(`storage delete ${del.status}`);
      return NextResponse.json({ ok: true });
    }
    const res = await graphql<{ dish_media: Array<{ file_id: string; uploader_id: string | null }> }>(
      `query ($id: uuid!) { dish_media(where: { id: { _eq: $id } }, limit: 1) { file_id uploader_id } }`,
      { useAdminSecret: true, variables: { id } }
    );
    if (res.errors?.length) throw new Error(res.errors[0].message);
    const row = res.data?.dish_media?.[0];
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (row.uploader_id !== caller.userId) {
      return NextResponse.json({ error: "You can only remove your own uploads." }, { status: 403 });
    }

    // Delete the storage object; the dish_media row cascades off storage.files.
    const del = await fetch(`${nhost.storageUrl}/files/${row.file_id}`, {
      method: "DELETE",
      headers: { "x-hasura-admin-secret": nhost.adminSecret ?? "" },
    });
    if (!del.ok) throw new Error(`storage delete ${del.status}`);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Couldn't remove that right now." }, { status: 502 });
  }
}
