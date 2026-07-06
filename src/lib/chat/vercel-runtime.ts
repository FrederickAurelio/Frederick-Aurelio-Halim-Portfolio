/** Vercel Hobby serverless function cap (see scripts/patch-chat-max-duration.mjs). */
export const VERCEL_FUNCTION_TIMEOUT_SECONDS = 60;

export const VERCEL_FUNCTION_TIMEOUT_MS =
  VERCEL_FUNCTION_TIMEOUT_SECONDS * 1000;

/** Abort the stream slightly before Vercel hard-kills the function. */
export const VERCEL_STREAM_DEADLINE_MS = VERCEL_FUNCTION_TIMEOUT_MS - 5_000;

/** Internal marker — clients map CHAT_VERCEL_TIMEOUT to user-facing copy. */
export const VERCEL_FUNCTION_TIMEOUT_CODE = "VERCEL_FUNCTION_TIMEOUT";

export function isVercelRuntime(): boolean {
  return process.env.VERCEL === "1";
}

export function isVercelFunctionTimeout(reason: unknown): boolean {
  if (reason instanceof Error) {
    return (
      reason.message === VERCEL_FUNCTION_TIMEOUT_CODE ||
      reason.name === "VercelFunctionTimeoutError"
    );
  }
  return false;
}

export function isVercelFunctionTimeoutSignal(signal?: AbortSignal): boolean {
  return Boolean(signal?.aborted && isVercelFunctionTimeout(signal.reason));
}

/** Merge parent abort (user stop) with a Vercel-only hard deadline. */
export function attachVercelStreamDeadline(parentSignal: AbortSignal): {
  signal: AbortSignal;
  clear: () => void;
} {
  if (!isVercelRuntime()) {
    return { signal: parentSignal, clear: () => {} };
  }

  const deadlineController = new AbortController();
  const timeoutId = setTimeout(() => {
    deadlineController.abort(
      Object.assign(new Error(VERCEL_FUNCTION_TIMEOUT_CODE), {
        name: "VercelFunctionTimeoutError",
      }),
    );
  }, VERCEL_STREAM_DEADLINE_MS);

  const onParentAbort = () => deadlineController.abort();
  parentSignal.addEventListener("abort", onParentAbort, { once: true });

  const signal = AbortSignal.any([parentSignal, deadlineController.signal]);

  return {
    signal,
    clear: () => {
      clearTimeout(timeoutId);
      parentSignal.removeEventListener("abort", onParentAbort);
    },
  };
}
