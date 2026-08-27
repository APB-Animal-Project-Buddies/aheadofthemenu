"use client";

/**
 * Owner-gated inline editor for the /creators/[slug] header + bio. Replaces
 * the header (avatar, name, badges, website, socials) and bio paragraph that
 * used to be static JSX in app/creators/[slug]/page.tsx.
 *
 * Ownership check is client-side: once signed in, GET /api/creators/claims
 * (authenticated) says which creator the viewer owns, and we compare ids.
 * The public page deliberately never includes owner_id (a user UUID), so
 * that's the only way to know. The component renders TWO branches:
 *   - not the owner (including anonymous visitors, mid-hydration, or a
 *     different signed-in user): reproduces the exact original markup,
 *     verbatim, from `creator` — pixel-identical to before this component
 *     existed.
 *   - the owner: same structure, but every editable value is wrapped in
 *     InlineEditField and saved via PATCH /api/creators/mine.
 *
 * Holds its own local copy of the profile (seeded from the `creator` prop,
 * updated in place on each successful save) so edits show up immediately
 * without waiting on a full page reload — the server-rendered `creator` prop
 * itself goes stale after a save, by design (see task notes).
 */
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { authFetch } from "@/lib/nhost/auth-fetch";
import { InlineEditField, clip } from "@/components/ui/InlineEditField";
import { CreatorPhotoUpload } from "@/components/CreatorPhotoUpload";
import { CreatorGallery } from "@/components/CreatorGallery";
import { CreatorOwnerBar } from "@/components/CreatorOwnerBar";
import { CREATOR_SOCIALS, orderedSocials, type CreatorProfile } from "@/lib/creators";

// Fields this editor can PATCH — all `string | null` columns, so a single
// generic `save()` helper can update any of them.
type TextField =
  | "display_name"
  | "creator_name"
  | "real_name"
  | "bio"
  | "website"
  | "image_url"
  | "youtube"
  | "instagram"
  | "tiktok"
  | "facebook"
  | "twitter_x"
  | "pinterest"
  | "substack";

// snake_case column -> camelCase PATCH /api/creators/mine body key.
const BODY_KEY: Record<TextField, string> = {
  display_name: "displayName",
  creator_name: "creatorName",
  real_name: "realName",
  bio: "bio",
  website: "website",
  image_url: "imageUrl",
  youtube: "youtube",
  instagram: "instagram",
  tiktok: "tiktok",
  facebook: "facebook",
  twitter_x: "twitterX",
  pinterest: "pinterest",
  substack: "substack",
};

function urlValidate(v: string): string | null {
  if (!v) return null;
  return /^https?:\/\/.+/i.test(v) ? null : "Must start with http:// or https://";
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function CreatorProfileEditor({ creator, claimed }: { creator: CreatorProfile; claimed: boolean }) {
  const { userId } = useAuth();
  const [ownedId, setOwnedId] = useState<string | null>(null);
  useEffect(() => {
    if (!userId) {
      setOwnedId(null);
      return;
    }
    let cancelled = false;
    authFetch("/api/creators/claims")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled) setOwnedId(d?.owned?.id ?? null);
      })
      .catch(() => {
        if (!cancelled) setOwnedId(null);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);
  const isOwner = !!userId && ownedId !== null && ownedId === creator.id;

  // Local copy so saved edits render immediately; only ever mutated by the
  // owner branch below, so non-owners always see the untouched prop values.
  const [profile, setProfile] = useState<CreatorProfile>(creator);
  // Owner-only: show the page exactly as a visitor sees it (from the latest
  // saved values), toggled from the owner bar.
  const [previewPublic, setPreviewPublic] = useState(false);

  const save = (field: TextField) => async (value: string) => {
    const res = await authFetch("/api/creators/mine", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [BODY_KEY[field]]: value }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || "Couldn't save");
    setProfile((p) => ({ ...p, [field]: value || null }) as CreatorProfile);
  };

  if (!isOwner || previewPublic) {
    // Visitors see the server-rendered prop; an owner previewing sees their saved edits.
    const view = isOwner ? profile : creator;
    return (
      <>
        <CreatorOwnerBar isOwner={isOwner} previewPublic={previewPublic} onTogglePreview={setPreviewPublic} />
        <header className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-start">
          {view.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- external/re-hosted URLs, no next/image domains configured
            <img
              src={view.image_url}
              alt={view.display_name}
              className="h-28 w-28 shrink-0 rounded-full border border-neutral-200 object-cover"
            />
          ) : (
            <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-apb/10 text-3xl font-bold text-apb">
              {view.display_name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-bold text-apb">{view.display_name}</h1>
              {claimed ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-apb/10 px-3 py-1 text-sm font-semibold text-apb">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  Managed by the creator
                </span>
              ) : null}
              {view.plant_based ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-sm font-semibold text-green-700">
                  <span aria-hidden="true">💚</span> Fully Plant-Based Creator!
                </span>
              ) : null}
            </div>
            {view.creator_name && view.creator_name !== view.display_name ? (
              <p className="text-neutral-500">{view.creator_name}</p>
            ) : null}
            {view.real_name && view.real_name !== view.display_name ? (
              <p className="text-sm text-neutral-400">{view.real_name}</p>
            ) : null}
            {view.website ? (
              <a
                href={view.website}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-sm font-medium text-apb hover:underline"
              >
                {new URL(view.website).hostname.replace(/^www\./, "")} ↗
              </a>
            ) : null}
            <SocialLinks creator={view} />
          </div>
        </header>

        {/* Bio */}
        {view.bio ? (
          <p className="mt-10 rounded-[16px] border border-neutral-200 bg-white/60 px-5 py-4 leading-relaxed text-neutral-800">
            {view.bio}
          </p>
        ) : null}

        <CreatorGallery items={view.gallery ?? []} />
      </>
    );
  }

  return (
    <>
      <CreatorOwnerBar isOwner={isOwner} previewPublic={previewPublic} onTogglePreview={setPreviewPublic} />
      <header className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-start">
        {profile.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- external/re-hosted URLs, no next/image domains configured
          <img
            src={profile.image_url}
            alt={profile.display_name}
            className="h-28 w-28 shrink-0 rounded-full border border-neutral-200 object-cover"
          />
        ) : (
          <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-apb/10 text-3xl font-bold text-apb">
            {profile.display_name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <InlineEditField
              label="Display name"
              value={profile.display_name}
              onSave={save("display_name")}
              validate={(v) => (v ? null : "Display name can't be empty")}
              renderValue={(v) => <h1 className="text-3xl font-bold text-apb">{v}</h1>}
            />
            {claimed ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-apb/10 px-3 py-1 text-sm font-semibold text-apb">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                Managed by the creator
              </span>
            ) : null}
            {creator.plant_based ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-sm font-semibold text-green-700">
                <span aria-hidden="true">💚</span> Fully Plant-Based Creator!
              </span>
            ) : null}
          </div>

          <div className="mt-2 max-w-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Photo</p>
            <CreatorPhotoUpload
              currentUrl={profile.image_url}
              onSaved={(url) => setProfile((p) => ({ ...p, image_url: url }))}
            />
          </div>

          <div className="mt-2 max-w-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Creator / brand name</p>
            <InlineEditField
              label="Creator/brand name"
              value={profile.creator_name ?? ""}
              onSave={save("creator_name")}
              placeholder="e.g. Rainbow Plant Life"
              emptyText="Add creator/brand name"
            />
          </div>

          <div className="mt-2 max-w-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Real name</p>
            <InlineEditField
              label="Real name"
              value={profile.real_name ?? ""}
              onSave={save("real_name")}
              placeholder="e.g. Jane Doe"
              emptyText="Add real name"
            />
          </div>

          <div className="mt-2 max-w-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Website</p>
            <InlineEditField
              label="Website"
              value={profile.website ?? ""}
              onSave={save("website")}
              type="url"
              placeholder="https://…"
              emptyText="Add website"
              validate={urlValidate}
              renderValue={(v) => (
                <a href={v} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-apb hover:underline">
                  {clip(hostnameOf(v))} ↗
                </a>
              )}
            />
          </div>

          <div className="mt-3 max-w-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Social links</p>
            <div className="mt-1 space-y-2">
              {CREATOR_SOCIALS.map(({ key, label }) => {
                const field = key as TextField;
                const value = (profile[key] as string | null) ?? "";
                return (
                  <div key={String(key)} className="flex items-center gap-2">
                    <span className="w-16 shrink-0 text-xs text-neutral-500">{label}</span>
                    <div className="min-w-0 flex-1">
                      <InlineEditField
                        label={label}
                        value={value}
                        onSave={save(field)}
                        type="url"
                        placeholder="https://…"
                        emptyText={`Add ${label}`}
                        validate={urlValidate}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Bio */}
      <div className="mt-10">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">Bio</p>
        <InlineEditField
          label="Bio"
          value={profile.bio ?? ""}
          onSave={save("bio")}
          multiline
          placeholder="Tell visitors about yourself…"
          emptyText="Add a bio"
          renderValue={(v) => (
            <p className="rounded-[16px] border border-neutral-200 bg-white/60 px-5 py-4 leading-relaxed text-neutral-800">
              {v}
            </p>
          )}
        />
      </div>

      <CreatorGallery
        items={profile.gallery ?? []}
        editable
        onChange={(gallery) => setProfile((p) => ({ ...p, gallery }))}
      />
    </>
  );
}

/** Present socials, primary_social pinned first (the creator's "current profile"). */
function SocialLinks({ creator }: { creator: CreatorProfile }) {
  const links = orderedSocials(creator);
  const extra = (creator.other_links ?? []).filter((l) => l && l.url);
  if (!links.length && !extra.length) return null;
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {links.map(({ key, label, url }) => {
        const isPrimary = key === creator.primary_social;
        return (
          <a
            key={key}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={
              isPrimary
                ? "rounded-full bg-apb px-4 py-1.5 text-sm font-semibold text-white transition hover:opacity-90"
                : "rounded-full border border-neutral-200 bg-white/70 px-4 py-1.5 text-sm font-medium text-apb transition hover:border-apb hover:bg-white"
            }
          >
            {label}
          </a>
        );
      })}
      {extra.map((l, i) => (
        <a
          key={`x-${i}`}
          href={l.url}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-neutral-200 bg-white/70 px-4 py-1.5 text-sm font-medium text-neutral-600 transition hover:border-apb hover:bg-white"
        >
          {l.label || new URL(l.url).hostname.replace(/^www\./, "")}
        </a>
      ))}
    </div>
  );
}
