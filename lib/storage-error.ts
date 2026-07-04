/**
 * lib/storage-error.ts
 *
 * Turns an error thrown by the Nhost storage client into a message worth
 * showing. The SDK throws FetchError with the parsed response body attached
 * (hasura-storage answers { error: { message } }); duck-typed here so we
 * don't depend on the SDK's export paths.
 */
export function storageErrorMessage(err: unknown): string {
  const e = err as {
    status?: number;
    body?: { error?: { message?: string } | string };
    message?: string;
  };

  const serverMsg =
    typeof e?.body?.error === "string" ? e.body.error : e?.body?.error?.message;
  if (serverMsg) {
    // Keep the server's reason, but translate the common cases to plain words.
    if (/too large|file size|exceed/i.test(serverMsg)) return `That file is too large (${serverMsg}).`;
    if (/bucket.*not.*found|not.*found.*bucket/i.test(serverMsg))
      return "The media storage bucket isn't available yet — the backend deploy may still be rolling out.";
    return serverMsg;
  }

  if (e?.status === 401 || e?.status === 403)
    return "You don't have permission to upload — try signing out and back in.";
  if (e?.status === 413) return "That file is too large.";
  if (typeof e?.message === "string" && e.message && e.message !== "Failed to fetch") return e.message;
  return "Upload failed — please try again.";
}
