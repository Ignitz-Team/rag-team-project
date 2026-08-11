import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE_NAME = "session";
// Header middleware injects into the forwarded request once a session is
// verified, so route handlers can scope data by user without re-verifying
// the JWT themselves. Always set fresh by middleware, so a client can't
// spoof it — see src/middleware.js.
export const SESSION_EMAIL_HEADER = "x-session-email";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: SESSION_TTL_SECONDS,
};

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not set — required to sign/verify session cookies.");
  }
  return new TextEncoder().encode(secret);
}

// Sign a session token for a logged-in user. Runs in Node API routes.
export async function createSessionToken({ id = null, name, email }) {
  return new SignJWT({ id, name, email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecretKey());
}

// Verify a session token. Edge-runtime safe — used by middleware.
export async function verifySessionToken(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload;
  } catch {
    return null;
  }
}

// Read the current user's email in an API route handler, from the header
// middleware injects. Returns null if somehow missing (e.g. the route
// isn't actually behind the middleware's auth gate).
export function getSessionEmail(req) {
  return req.headers.get(SESSION_EMAIL_HEADER) || null;
}
