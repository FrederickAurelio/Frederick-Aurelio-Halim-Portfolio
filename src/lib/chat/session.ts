import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

export const CHAT_SESSION_COOKIE = "portfolio-chat-session";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** ~400 days — long-lived anonymous session id */
export const CHAT_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 400;

export function createSessionId(): string {
  return crypto.randomUUID();
}

export function isValidSessionId(value: string | undefined | null): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

/** Secure cookies only over HTTPS — plain HTTP (VPS IP) must use secure: false. */
export function isSecureSessionRequest(
  request: Pick<NextRequest, "headers" | "nextUrl">,
): boolean {
  const forwarded = request.headers.get("x-forwarded-proto");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim().toLowerCase() === "https";
  }
  return request.nextUrl.protocol === "https:";
}

export async function requireSessionId(): Promise<string> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(CHAT_SESSION_COOKIE)?.value;
  if (!isValidSessionId(sessionId)) {
    throw new SessionError("Missing chat session");
  }
  return sessionId;
}

export class SessionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SessionError";
  }
}
