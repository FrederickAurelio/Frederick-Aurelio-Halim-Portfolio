import type { NextRequest, NextResponse } from "next/server";
import { getChatStore, isUpstashProvider } from "./index";
import {
  applyUpstashSyncCookie,
  hydrateUpstashSyncToken,
} from "./upstash-sync.server";
import type { ChatStore } from "./types";

export async function prepareChatStore(): Promise<ChatStore> {
  if (isUpstashProvider()) {
    await hydrateUpstashSyncToken();
  }
  return getChatStore();
}

export function finalizeChatJsonResponse(
  response: NextResponse,
  request: NextRequest,
): NextResponse {
  if (isUpstashProvider()) {
    applyUpstashSyncCookie(response, request);
  }
  return response;
}
