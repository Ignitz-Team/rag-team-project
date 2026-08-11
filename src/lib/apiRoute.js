import { NextResponse } from "next/server";

// Wraps a Next.js route handler so an unexpected error (missing env var,
// unreachable database, etc.) always comes back as a JSON error response
// instead of an empty body. Without this, an unhandled throw in production
// produces a 500 with no body at all, and `res.json()` on the client fails
// with an opaque "Unexpected end of JSON input" instead of the real cause.
export function withErrorHandling(handler) {
  return async function wrapped(...args) {
    try {
      return await handler(...args);
    } catch (error) {
      console.error("[api] Unhandled route error:", error);
      const message = error?.message || "Internal server error.";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  };
}
