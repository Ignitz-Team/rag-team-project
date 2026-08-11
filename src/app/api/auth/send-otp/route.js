import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { query, ensureTables } from "@/lib/db";
import { sendOtpEmail, sendOtpSms } from "@/lib/otpService";

const OTP_TTL_MINUTES = Number(process.env.OTP_TTL_MINUTES || 15);

export async function POST(req) {
  await ensureTables();
  const body = await req.json();
  const email = body.email?.trim().toLowerCase();
  const phone = body.phone?.trim();

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }
  if (!phone) {
    return NextResponse.json({ error: "Phone number is required." }, { status: 400 });
  }

  const existing = await query("SELECT id FROM users WHERE email = $1", [email]);
  if (existing.rows.length > 0) {
    return NextResponse.json({ error: "This email is already registered." }, { status: 409 });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString();

  await query(
    `INSERT INTO otps (email, phone, otp_hash, expires_at)
      VALUES ($1, $2, $3, $4)`,
    [email, phone, otpHash, expiresAt]
  );

  await sendOtpEmail(email, otp);

  let smsSent = false;
  try {
    await sendOtpSms(phone, otp);
    smsSent = true;
  } catch (error) {
    console.warn("SMS OTP not sent:", error.message);
  }

  return NextResponse.json({ emailSent: true, smsSent });
}
