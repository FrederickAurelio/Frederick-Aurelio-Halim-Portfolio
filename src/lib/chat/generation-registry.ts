import { getChatStore } from "@/lib/chat-store";

type LocalGeneration = {
  abortController: AbortController;
  assistantMessageId: string;
};

/** In-process abort handle for the instance running OpenRouter. */
const localRegistry = new Map<string, LocalGeneration>();

export async function tryAcquireGeneration(
  sessionId: string,
  assistantMessageId: string,
): Promise<AbortController | null> {
  const store = getChatStore();
  const acquired = await store.tryAcquireGenerationLock(
    sessionId,
    assistantMessageId,
  );

  if (!acquired) return null;

  await store.clearGenerationStopRequest(sessionId);

  const abortController = new AbortController();
  localRegistry.set(sessionId, { abortController, assistantMessageId });
  return abortController;
}

export async function stopActiveGeneration(
  sessionId: string,
): Promise<boolean> {
  const store = getChatStore();
  const locked = await store.isGenerationLocked(sessionId);
  const local = localRegistry.get(sessionId);

  if (!locked && !local) return false;

  await store.requestGenerationStop(sessionId);
  local?.abortController.abort();
  return true;
}

export async function releaseGeneration(sessionId: string): Promise<void> {
  localRegistry.delete(sessionId);

  const store = getChatStore();
  await store.releaseGenerationLock(sessionId);
  await store.clearGenerationStopRequest(sessionId);
}

export function getLocalAbortController(
  sessionId: string,
): AbortController | null {
  return localRegistry.get(sessionId)?.abortController ?? null;
}
