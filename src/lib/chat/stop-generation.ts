export async function stopChatGeneration(): Promise<boolean> {
  const response = await fetch("/api/chat/stop", { method: "POST" });
  if (!response.ok) return false;

  const body = (await response.json()) as { stopped?: boolean };
  return body.stopped === true;
}
