import { cookies, headers } from "next/headers";
import type { NextRequest } from "next/server";
import type { Redis } from "@upstash/redis/node";
import { isSecureSessionRequest } from "@/lib/chat/session";
import {
  UPSTASH_SYNC_COOKIE,
  UPSTASH_SYNC_HEADER,
  UPSTASH_SYNC_MAX_AGE_SECONDS,
} from "./sync-constants";

let pendingSyncToken: string | undefined;
let clientRef: Redis | null = null;

export function registerUpstashClient(client: Redis): void {
  clientRef = client;
  applyPendingUpstashSyncToken();
}

export function setPendingUpstashSyncToken(token: string | undefined): void {
  pendingSyncToken = token?.trim() || undefined;
  applyPendingUpstashSyncToken();
}

export function applyPendingUpstashSyncToken(): void {
  if (!clientRef || !pendingSyncToken) return;
  clientRef.readYourWritesSyncToken = pendingSyncToken;
}

export function captureUpstashSyncToken(): string | undefined {
  return clientRef?.readYourWritesSyncToken;
}

export async function hydrateUpstashSyncToken(): Promise<void> {
  const headerStore = await headers();
  const fromHeader = headerStore.get(UPSTASH_SYNC_HEADER)?.trim();
  if (fromHeader) {
    setPendingUpstashSyncToken(fromHeader);
    return;
  }

  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(UPSTASH_SYNC_COOKIE)?.value;
  setPendingUpstashSyncToken(fromCookie);
}

function buildSyncCookie(token: string, secure: boolean): string {
  const parts = [
    `${UPSTASH_SYNC_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${UPSTASH_SYNC_MAX_AGE_SECONDS}`,
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export function applyUpstashSyncCookie(
  response: {
    cookies: {
      set: (options: {
        name: string;
        value: string;
        httpOnly: boolean;
        secure: boolean;
        sameSite: "lax";
        path: string;
        maxAge: number;
      }) => void;
    };
  },
  request: Pick<NextRequest, "headers" | "nextUrl">,
): void {
  const token = captureUpstashSyncToken();
  if (!token) return;

  response.cookies.set({
    name: UPSTASH_SYNC_COOKIE,
    value: token,
    httpOnly: true,
    secure: isSecureSessionRequest(request),
    sameSite: "lax",
    path: "/",
    maxAge: UPSTASH_SYNC_MAX_AGE_SECONDS,
  });
}

export function appendUpstashSyncCookieHeader(
  headersOut: Headers,
  request: Pick<NextRequest, "headers" | "nextUrl">,
): void {
  const token = captureUpstashSyncToken();
  if (!token) return;
  headersOut.append(
    "Set-Cookie",
    buildSyncCookie(token, isSecureSessionRequest(request)),
  );
}

export function upstashDonePayload(): Record<string, unknown> | undefined {
  const token = captureUpstashSyncToken();
  return token ? { upstashSyncToken: token } : undefined;
}
