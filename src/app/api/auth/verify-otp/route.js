import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { query, ensureTables } from "@/lib/db";

export async function POST(req) {
  await ensureTables();
  const body = await req.json();
  const email = body.email?.trim().toLowerCase();
  const otp = body.otp?.trim();

  if (!email || !otp) {
    return NextResponse.json({ error: "Email and OTP are required." }, { status: 400 });
  }

  const result = await query(
    `SELECT otp_hash, expires_at FROM otps
     WHERE email = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [email]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "OTP not found. Please request a new code." }, { status: 404 });
  }

  const record = result.rows[0];
  if (new Date(record.expires_at) < new Date()) {
    return NextResponse.json({ error: "OTP has expired. Please request a new code." }, { status: 400 });
  }

  const valid = await bcrypt.compare(otp, record.otp_hash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid OTP." }, { status: 400 });
  }

  return NextResponse.json({ verified: true });
}
