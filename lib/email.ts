/**
 * lib/email.ts
 *
 * Minimal transactional-email helper. Only used today for the creator-claim
 * notification (see app/api/creators/claims/route.ts) — a new claim doesn't
 * change anything visible on its own (approval still happens on
 * /admin/edits), so without this an admin has no way to learn a claim exists
 * short of polling the dashboard.
 *
 * Best-effort by design: RESEND_API_KEY absent (e.g. local dev without the
 * key configured) or the send itself failing must never break the caller's
 * request — the claim row is already committed by the time this runs.
 */
import { Resend } from "resend";

const NOTIFY_TO = "aheadofthemenu@gmail.com";
const FROM = process.env.EMAIL_FROM || "Ahead of the Menu <notifications@aheadofthemenu.com>";

let client: Resend | null | undefined;
function getClient(): Resend | null {
  if (client !== undefined) return client;
  const key = process.env.RESEND_API_KEY;
  client = key ? new Resend(key) : null;
  if (!client) console.warn("[email] RESEND_API_KEY not set — skipping send");
  return client;
}

export async function sendCreatorClaimNotification(claim: {
  claimId: string;
  creatorDisplayName: string;
  creatorSlug: string | null;
  claimantEmail: string;
  claimantUserId: string;
  evidence: string;
}): Promise<void> {
  const resend = getClient();
  if (!resend) return;

  const subject = `Creator claim: ${claim.creatorDisplayName}`;
  const profileUrl = claim.creatorSlug ? `https://www.aheadofthemenu.com/creators/${claim.creatorSlug}` : null;
  const text = [
    `${claim.claimantEmail} wants to claim the creator profile "${claim.creatorDisplayName}".`,
    "",
    `Claimant email: ${claim.claimantEmail}`,
    `Claimant user id: ${claim.claimantUserId}`,
    profileUrl ? `Profile: ${profileUrl}` : null,
    `Claim id: ${claim.claimId}`,
    "",
    "Evidence submitted:",
    claim.evidence,
    "",
    "Review and approve/reject at https://www.aheadofthemenu.com/admin/edits (Creator claims tab).",
  ]
    .filter((line) => line !== null)
    .join("\n");

  try {
    await resend.emails.send({
      from: FROM,
      to: NOTIFY_TO,
      replyTo: claim.claimantEmail,
      subject,
      text,
    });
  } catch (err) {
    // Best-effort: the claim itself is already committed, so a notification
    // failure shouldn't surface as an error to the claimant.
    console.error("[email] failed to send creator-claim notification", err);
  }
}
