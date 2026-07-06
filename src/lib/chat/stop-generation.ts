import { chatApiHeaders } from "@/lib/chat/fetch-messages";

export async function stopChatGeneration(): Promise<boolean> {
  const response = await fetch("/api/chat/stop", {
    method: "POST",
    headers: chatApiHeaders(),
  });
  if (!response.ok) return false;
  const body = (await response.json()) as { stopped?: boolean };
  return Boolean(body.stopped);
}
