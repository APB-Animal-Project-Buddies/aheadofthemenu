/**
 * POST   /api/reverse-lookup/dishes/[id]/photos  (Bearer) { fileId, caption? }
 * DELETE /api/reverse-lookup/dishes/[id]/photos  (Bearer) { id }  (uploader only)
 *
 * The browser uploads the image itself to Nhost storage (bucket 'dish-media',
 * user-role permission), then POSTs here to register it against a reverse-lookup
 * dish. We validate the file server-side — it must live in the dish-media bucket,
 * be finished uploading, and be an image/* — so the strip can't reference
 * arbitrary files. Photos appear immediately; the uploader can delete their own.
 */
import { NextRequest, NextResponse } from "next/server";
import { graphql, nhost } from "@/lib/nhost";
import { bearerToken, verifyNhostJwt } from "@/lib/jwt";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const fileUrl = (fileId: string) => `${nhost.storageUrl}/files/${fileId}`;

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const caller = verifyNhostJwt(bearerToken(request.headers.get("authorization")));
  if (!caller) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const fileId = String(body?.fileId ?? "").trim();
  const caption = typeof body?.caption === "string" ? body.caption.slice(0, 300) : null;
  if (!fileId) return NextResponse.json({ error: "Missing fileId" }, { status: 400 });

  try {
    const fileRes = await graphql<{ file: { bucketId: string; mimeType: string | null; isUploaded: boolean } | null }>(
      `query ($id: uuid!) { file(id: $id) { bucketId mimeType isUploaded } }`,
      { useAdminSecret: true, variables: { id: fileId } }
    );
    if (fileRes.errors?.length) throw new Error(fileRes.errors[0].message);
    const file = fileRes.data?.file;
    if (!file || file.bucketId !== "dish-media" || !file.isUploaded) {
      return NextResponse.json({ error: "File not found in the gallery bucket." }, { status: 404 });
    }
    if (!(file.mimeType ?? "").startsWith("image/")) {
      return NextResponse.json({ error: "Only images are allowed." }, { status: 415 });
    }

    const ins = await graphql<{ insert_restaurant_dish_photos_one: { id: string } | null }>(
      `mutation ($obj: restaurant_dish_photos_insert_input!) {
         insert_restaurant_dish_photos_one(object: $obj) { id }
       }`,
      {
        useAdminSecret: true,
        variables: { obj: { dish_id: params.id, file_id: fileId, uploader_id: caller.userId, caption } },
      }
    );
    if (ins.errors?.length) {
      if (/foreign key/i.test(ins.errors[0].message)) {
        return NextResponse.json({ error: "Dish not found" }, { status: 404 });
      }
      throw new Error(ins.errors[0].message);
    }
    const id = ins.data?.insert_restaurant_dish_photos_one?.id;
    if (!id) throw new Error("insert failed");
    return NextResponse.json({ ok: true, id, url: fileUrl(fileId) });
  } catch {
    return NextResponse.json({ error: "Couldn't add that photo." }, { status: 502 });
  }
}

export async function DELETE(request: NextRequest) {
  const caller = verifyNhostJwt(bearerToken(request.headers.get("authorization")));
  if (!caller) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const id = String(body?.id ?? "").trim();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  try {
    const res = await graphql<{ restaurant_dish_photos: Array<{ file_id: string; uploader_id: string | null }> }>(
      `query ($id: uuid!) { restaurant_dish_photos(where: { id: { _eq: $id } }, limit: 1) { file_id uploader_id } }`,
      { useAdminSecret: true, variables: { id } }
    );
    if (res.errors?.length) throw new Error(res.errors[0].message);
    const row = res.data?.restaurant_dish_photos?.[0];
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (row.uploader_id !== caller.userId) {
      return NextResponse.json({ error: "You can only remove your own uploads." }, { status: 403 });
    }

    // Remove the DB row, then best-effort delete the storage object (file_id is
    // a plain reference here, not an ON DELETE CASCADE link like dish_media).
    const del = await graphql<{ delete_restaurant_dish_photos_by_pk: { id: string } | null }>(
      `mutation ($id: uuid!) { delete_restaurant_dish_photos_by_pk(id: $id) { id } }`,
      { useAdminSecret: true, variables: { id } }
    );
    if (del.errors?.length) throw new Error(del.errors[0].message);
    await fetch(`${nhost.storageUrl}/files/${row.file_id}`, {
      method: "DELETE",
      headers: { "x-hasura-admin-secret": nhost.adminSecret ?? "" },
    }).catch(() => {});
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Couldn't remove that right now." }, { status: 502 });
  }
}
