import { type NextRequest, NextResponse } from "next/server";
import {
  CHAT_SESSION_COOKIE,
  CHAT_SESSION_MAX_AGE_SECONDS,
  CHAT_SESSION_REQUEST_HEADER,
  createSessionId,
  isSecureSessionRequest,
  isValidSessionId,
} from "@/lib/chat/session";

export function middleware(request: NextRequest) {
  const existing = request.cookies.get(CHAT_SESSION_COOKIE)?.value;
  const sessionId = isValidSessionId(existing) ? existing : createSessionId();
  const isNewSession = !isValidSessionId(existing);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(CHAT_SESSION_REQUEST_HEADER, sessionId);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  if (isNewSession) {
    response.cookies.set({
      name: CHAT_SESSION_COOKIE,
      value: sessionId,
      httpOnly: true,
      secure: isSecureSessionRequest(request),
      sameSite: "lax",
      path: "/",
      maxAge: CHAT_SESSION_MAX_AGE_SECONDS,
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
