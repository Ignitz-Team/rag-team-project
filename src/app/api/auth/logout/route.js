import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/session";
import { withErrorHandling } from "@/lib/apiRoute";

export const POST = withErrorHandling(async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return response;
});
