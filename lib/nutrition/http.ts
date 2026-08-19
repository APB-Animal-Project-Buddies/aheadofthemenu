// fetch with retry/backoff for the nutrition providers. Handles 429 (rate limit, honoring
// Retry-After) and 5xx with exponential backoff — so a bulk populate self-paces against
// USDA's hourly cap instead of erroring out.
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function fetchRetry(
  url: string | URL,
  init: RequestInit = {},
  opts: { tries?: number; baseDelayMs?: number; maxDelayMs?: number; timeoutMs?: number } = {}
): Promise<Response> {
  const { tries = 6, baseDelayMs = 1000, maxDelayMs = 60000, timeoutMs } = opts;
  let wait = baseDelayMs;
  let last: Response | null = null;
  for (let attempt = 0; attempt < tries; attempt++) {
    let res: Response;
    try {
      res = await fetch(url, { ...init, signal: timeoutMs ? AbortSignal.timeout(timeoutMs) : init.signal });
    } catch (e) {
      // transient network error — back off and retry
      if (attempt === tries - 1) throw e;
      await sleep(wait);
      wait = Math.min(wait * 2, maxDelayMs);
      continue;
    }
    if (res.status !== 429 && res.status < 500) return res;
    last = res;
    const retryAfter = Number(res.headers.get("retry-after"));
    const delay = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : wait;
    if (attempt < tries - 1) {
      await sleep(delay);
      wait = Math.min(wait * 2, maxDelayMs);
    }
  }
  return last!;
}
