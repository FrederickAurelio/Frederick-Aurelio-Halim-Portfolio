import { type NextRequest, NextResponse } from "next/server";
import {
  CHAT_SESSION_COOKIE,
  CHAT_SESSION_MAX_AGE_SECONDS,
  createSessionId,
  isValidSessionId,
} from "@/lib/chat/session";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const existing = request.cookies.get(CHAT_SESSION_COOKIE)?.value;

  if (!isValidSessionId(existing)) {
    response.cookies.set({
      name: CHAT_SESSION_COOKIE,
      value: createSessionId(),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
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
