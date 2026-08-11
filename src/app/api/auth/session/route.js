import { NextResponse } from "next/server";
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS } from "@/lib/session";

// Mints our own session cookie for a user who already authenticated via the
// Firebase client SDK (Google sign-in in src/app/login/page.js). There's no
// Firebase Admin SDK/service account configured in this project, so the
// Google profile is trusted as-is once the client SDK's popup flow has
// already completed — this matches the trust level the Google login path
// already had before session cookies existed, it just now also gets a real
// session instead of only a localStorage flag.
export async function POST(req) {
  const body = await req.json();
  const email = body?.email?.trim().toLowerCase();
  const name = body?.name?.trim();

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const token = await createSessionToken({ name: name || email, email });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);
  return response;
}
