export const REQUEST_TIMEOUT_MESSAGE = "Request timed out — please try again.";

const DEFAULT_TIMEOUT_MS = 60_000;

export async function fetchWithTimeout(
  url: string,
  init: RequestInit & { timeoutMs?: number } = {},
): Promise<Response> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, signal, ...rest } = init;
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs);

  const onParentAbort = () => timeoutController.abort();
  signal?.addEventListener("abort", onParentAbort);

  const combinedSignal = signal
    ? AbortSignal.any([signal, timeoutController.signal])
    : timeoutController.signal;

  try {
    return await fetch(url, { ...rest, signal: combinedSignal });
  } catch (error) {
    if (timeoutController.signal.aborted && !signal?.aborted) {
      throw new Error(REQUEST_TIMEOUT_MESSAGE);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener("abort", onParentAbort);
  }
}
