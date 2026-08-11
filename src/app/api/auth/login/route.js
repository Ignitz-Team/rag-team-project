import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { query, ensureTables } from "@/lib/db";
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS } from "@/lib/session";
import { withErrorHandling } from "@/lib/apiRoute";

export const POST = withErrorHandling(async function POST(req) {
  await ensureTables();
  const body = await req.json();
  const email = body.email?.trim().toLowerCase();
  const password = body.password;

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const result = await query(
    "SELECT id, name, email, phone, password FROM users WHERE email = $1",
    [email]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const user = result.rows[0];
  const passwordMatches = await bcrypt.compare(password, user.password);
  if (!passwordMatches) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const token = await createSessionToken({ id: user.id, name: user.name, email: user.email });
  const response = NextResponse.json({ id: user.id, name: user.name, email: user.email, phone: user.phone });
  response.cookies.set(SESSION_COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);
  return response;
});
