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

/**
 * Tell a claimant how their creator-page claim was decided. Best-effort, like
 * the admin notification: the decision is already committed by the caller.
 */
export async function sendCreatorClaimDecision(args: {
  to: string;
  creatorDisplayName: string;
  creatorSlug: string | null;
  status: "approved" | "rejected";
}): Promise<void> {
  const resend = getClient();
  if (!resend) return;

  const profileUrl = args.creatorSlug ? `https://www.aheadofthemenu.com/creators/${args.creatorSlug}` : null;
  const approved = args.status === "approved";
  const subject = approved
    ? `Your creator page "${args.creatorDisplayName}" is yours`
    : `About your claim on "${args.creatorDisplayName}"`;
  const text = (approved
    ? [
        `Good news — your claim on the creator page "${args.creatorDisplayName}" was approved.`,
        "",
        profileUrl ? `Your page: ${profileUrl}` : null,
        "Open it while signed in, hover any field and click Edit to update your photo, bio and links.",
        "You can also get there from https://www.aheadofthemenu.com/profile → \"Edit my Creator Profile\".",
      ]
    : [
        `We reviewed your claim on the creator page "${args.creatorDisplayName}" and couldn't verify it from the evidence provided.`,
        "",
        "If this is your page, reply to this email with a link that shows the connection (for example, a post on the profile itself, or a link to Ahead of the Menu from your site or bio) and we'll take another look.",
      ]
  )
    .filter((line) => line !== null)
    .join("\n");

  try {
    await resend.emails.send({ from: FROM, to: args.to, replyTo: NOTIFY_TO, subject, text });
  } catch (err) {
    console.error("[email] failed to send creator-claim decision", err);
  }
}
