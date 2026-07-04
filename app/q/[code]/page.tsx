/**
 * /q/<code> — resolver for a pooled "potluck" QR code.
 *
 *   unclaimed  -> a friendly page inviting the visitor to claim it
 *   active_dishes -> redirect to the owner's /<handle>/active-dishes
 *   dish_instance -> redirect to /dishes/<dishId>?instance=<code>
 *
 * Codes and their targets live in public.open_qrs_for_potluck; owners set the
 * target from the "Claim a URL" section on their active-dishes page.
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import { graphql } from "@/lib/nhost";

export const dynamic = "force-dynamic";

type QrRow = {
  code: string;
  owner_id: string | null;
  target_type: "active_dishes" | "dish_instance" | null;
  target_id: string | null;
};

type Resolution =
  | { kind: "redirect"; to: string }
  | { kind: "unclaimed"; code: string }
  | { kind: "notfound" }
  | { kind: "error" };

async function resolve(code: string): Promise<Resolution> {
  if (!code) return { kind: "notfound" };
  try {
    const res = await graphql<{ open_qrs_for_potluck: QrRow[] }>(
      `query ($code: String!) {
         open_qrs_for_potluck(where: { code: { _eq: $code } }, limit: 1) {
           code owner_id target_type target_id
         }
       }`,
      { useAdminSecret: true, variables: { code } }
    );
    if (res.errors?.length) return { kind: "error" };
    const row = res.data?.open_qrs_for_potluck?.[0];
    if (!row) return { kind: "notfound" };
    if (!row.owner_id || !row.target_type) return { kind: "unclaimed", code: row.code };

    if (row.target_type === "dish_instance" && row.target_id) {
      const inst = await graphql<{ review_instance: Array<{ dish_id: number }> }>(
        `query ($code: bpchar!) { review_instance(where: { id: { _eq: $code } }, limit: 1) { dish_id } }`,
        { useAdminSecret: true, variables: { code: row.target_id } }
      );
      if (inst.errors?.length) return { kind: "error" };
      const dishId = inst.data?.review_instance?.[0]?.dish_id;
      if (dishId != null) return { kind: "redirect", to: `/dishes/${dishId}?instance=${row.target_id}` };
      // Instance vanished — fall through to the owner's active dishes below.
    }

    // active_dishes (or a dish_instance whose instance is gone) -> owner's page.
    const owner = await graphql<{ users: Array<{ handle: string }> }>(
      `query ($uid: uuid!) { users(where: { id: { _eq: $uid } }, limit: 1) { handle } }`,
      { useAdminSecret: true, variables: { uid: row.owner_id } }
    );
    if (owner.errors?.length) return { kind: "error" };
    const handle = owner.data?.users?.[0]?.handle;
    if (!handle) return { kind: "error" };
    return { kind: "redirect", to: `/${handle}/active-dishes` };
  } catch {
    return { kind: "error" };
  }
}

function Centered({ title, body, children }: { title: string; body: string; children?: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-xl px-5 py-20 text-center">
      <h1 className="text-2xl font-bold text-apb">{title}</h1>
      <p className="mt-3 text-neutral-600">{body}</p>
      {children}
    </main>
  );
}

export default async function QrResolvePage({ params }: { params: { code: string } }) {
  const r = await resolve(decodeURIComponent(params.code));
  if (r.kind === "redirect") redirect(r.to);
  if (r.kind === "error")
    return <Centered title="Temporarily unavailable" body="We couldn't resolve this QR right now. Please try again in a moment." />;
  if (r.kind === "notfound")
    return <Centered title="Unknown code" body="This QR code isn't part of the potluck pool." />;

  // Unclaimed: invite them to make it theirs.
  return (
    <Centered
      title="This QR is up for grabs 🌱"
      body="It hasn't been claimed yet. Sign in, then paste this code into the “Claim a URL” section on your Active Dishes page to point it at your dishes."
    >
      <p className="mt-4 inline-block rounded-lg bg-apb/5 px-4 py-2 font-mono text-lg font-semibold text-apb">
        {r.code}
      </p>
      <div className="mt-6">
        <Link href="/login" className="rounded-full bg-apb px-5 py-2.5 text-sm font-medium text-white transition hover:bg-apb-light">
          Sign in to claim it
        </Link>
      </div>
    </Centered>
  );
}
