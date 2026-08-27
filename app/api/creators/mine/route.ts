/**
 * /api/creators/mine — the caller's own creator profile.
 *
 *   POST  -> create a brand-new creator profile owned immediately by the
 *            caller (claim path b: "this creator isn't listed yet").
 *            Dedicated endpoint — POST /api/creators (anonymous "suggest a
 *            missing creator" from the dish-submission flow) is untouched
 *            and lands unclaimed rows; this one always sets owner_id on
 *            insert.
 *   PATCH -> inline-edit any subset of the caller's own profile fields
 *            (bio, socials, website, image, names). Owner-gated by
 *            owner_id = caller.userId; 404s if the caller doesn't own a
 *            creator row yet.
 */
import { NextRequest, NextResponse } from "next/server";
import { verifyNhostJwt, bearerToken } from "@/lib/jwt";
import {
  createOwnedCreator,
  updateOwnedCreator,
  CreatorNameTakenError,
  CreatorNotFoundError,
  CREATOR_SOCIAL_KEYS,
  MAX_GALLERY_ITEMS,
  sanitizeGallery,
  type CreatorProfilePatch,
} from "@/lib/creators";

const URL_RE = /^https?:\/\/.+/i;
const NAME_MAX = 120;
const BIO_MAX = 2000;
const MAX_OTHER_LINKS = 10;
const SOCIAL_KEY_SET = new Set<string>(CREATOR_SOCIAL_KEYS);

// camelCase body key -> validation kind, shared between the name-length and
// URL-shaped field groups below.
const NAME_FIELDS = [
  ["displayName", "Display name"],
  ["creatorName", "Creator/brand name"],
  ["realName", "Real name"],
] as const;
const URL_FIELDS = [
  ["website", "Website"],
  ["imageUrl", "Image URL"],
  ["youtube", "YouTube"],
  ["instagram", "Instagram"],
  ["tiktok", "TikTok"],
  ["facebook", "Facebook"],
  ["twitterX", "X"],
  ["pinterest", "Pinterest"],
  ["substack", "Substack"],
] as const;

export const dynamic = "force-dynamic";
// Nhost can be slow after idle (cold start); the default function timeout killed
// requests mid-mutation — Hasura had already committed, so the client saw a
// "network error" yet the write succeeded. 60s lets the function wait it out.
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const caller = verifyNhostJwt(bearerToken(req.headers.get("authorization")));
  if (!caller) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const displayName = String(body?.displayName ?? "").trim().slice(0, 120);
  const creatorName = String(body?.creatorName ?? "").trim().slice(0, 120);
  const realName = String(body?.realName ?? "").trim().slice(0, 120);
  let website = String(body?.website ?? "").trim().slice(0, 300);

  if (!displayName) return NextResponse.json({ error: "displayName is required" }, { status: 400 });
  // Unlike claiming an existing row, this INSERTs a new owner_id immediately —
  // no admin ever reviews it. A website is the one piece of evidence that
  // makes the resulting page checkable at all (same requirement AddCreatorLine
  // already imposes for the near-identical "add a new creator" action), so it
  // can't be skipped the way it could before.
  if (!website) {
    return NextResponse.json(
      { error: "A website or channel link is required so this page is verifiable." },
      { status: 400 }
    );
  }
  if (!/^https?:\/\//i.test(website)) website = `https://${website}`;
  if (!/^https?:\/\/[^\s]+\.[^\s]+/i.test(website)) {
    return NextResponse.json({ error: "That doesn't look like a valid website." }, { status: 400 });
  }

  try {
    const creator = await createOwnedCreator(caller.userId, {
      displayName,
      creatorName: creatorName || undefined,
      realName: realName || undefined,
      website: website || undefined,
    });
    return NextResponse.json({ ok: true, creator });
  } catch (e) {
    if (e instanceof CreatorNameTakenError) {
      return NextResponse.json(
        { error: "That name is already taken — try claiming it instead." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Temporarily unavailable" }, { status: 502 });
  }
}

export async function PATCH(req: NextRequest) {
  const caller = verifyNhostJwt(bearerToken(req.headers.get("authorization")));
  if (!caller) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const patch: CreatorProfilePatch = {};

  for (const [key, label] of NAME_FIELDS) {
    if (body?.[key] === undefined) continue;
    const v = String(body[key] ?? "").trim();
    if (v.length > NAME_MAX) {
      return NextResponse.json({ error: `${label} must be ${NAME_MAX} characters or fewer` }, { status: 400 });
    }
    if (key === "displayName" && !v) {
      return NextResponse.json({ error: "Display name can't be empty" }, { status: 400 });
    }
    (patch as Record<string, unknown>)[key] = v || null;
  }

  if (body?.bio !== undefined) {
    const v = String(body.bio ?? "").trim();
    if (v.length > BIO_MAX) {
      return NextResponse.json({ error: `Bio must be ${BIO_MAX} characters or fewer` }, { status: 400 });
    }
    patch.bio = v || null;
  }

  // Empty clears the field; non-empty must look like a URL.
  for (const [key, label] of URL_FIELDS) {
    if (body?.[key] === undefined) continue;
    const v = String(body[key] ?? "").trim();
    if (v && !URL_RE.test(v)) {
      return NextResponse.json({ error: `${label} doesn't look like a valid URL` }, { status: 400 });
    }
    (patch as Record<string, unknown>)[key] = v || null;
  }

  if (body?.primarySocial !== undefined) {
    const v = body.primarySocial === null ? "" : String(body.primarySocial).trim();
    if (v && !SOCIAL_KEY_SET.has(v)) {
      return NextResponse.json({ error: "Invalid primarySocial" }, { status: 400 });
    }
    patch.primarySocial = v || null;
  }

  if (body?.otherLinks !== undefined) {
    if (!Array.isArray(body.otherLinks)) {
      return NextResponse.json({ error: "otherLinks must be an array" }, { status: 400 });
    }
    if (body.otherLinks.length > MAX_OTHER_LINKS) {
      return NextResponse.json({ error: `otherLinks is capped at ${MAX_OTHER_LINKS} links` }, { status: 400 });
    }
    const links: Array<{ label?: string; url: string }> = [];
    for (const raw of body.otherLinks) {
      const url = String(raw?.url ?? "").trim();
      if (!url || !URL_RE.test(url)) {
        return NextResponse.json({ error: "Each additional link needs a valid URL" }, { status: 400 });
      }
      const label = typeof raw?.label === "string" ? raw.label.trim().slice(0, 60) : "";
      links.push(label ? { label, url } : { url });
    }
    patch.otherLinks = links;
  }

  if (body?.gallery !== undefined) {
    if (!Array.isArray(body.gallery)) {
      return NextResponse.json({ error: "gallery must be an array" }, { status: 400 });
    }
    if (body.gallery.length > MAX_GALLERY_ITEMS) {
      return NextResponse.json({ error: `Gallery is capped at ${MAX_GALLERY_ITEMS} items` }, { status: 400 });
    }
    const clean = sanitizeGallery(body.gallery);
    if (clean.length !== body.gallery.length) {
      return NextResponse.json(
        { error: "One of those links isn't a YouTube, TikTok or Instagram post (or an uploaded image)" },
        { status: 400 }
      );
    }
    patch.gallery = clean;
  }

  if (!Object.keys(patch).length) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  try {
    const creator = await updateOwnedCreator(caller.userId, patch);
    return NextResponse.json({ ok: true, creator });
  } catch (e) {
    if (e instanceof CreatorNameTakenError) {
      return NextResponse.json({ error: "That name is already taken" }, { status: 409 });
    }
    if (e instanceof CreatorNotFoundError) {
      return NextResponse.json({ error: "You don't own a creator profile yet" }, { status: 404 });
    }
    return NextResponse.json({ error: "Temporarily unavailable" }, { status: 502 });
  }
}
