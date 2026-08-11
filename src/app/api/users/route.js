import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { query, ensureTables } from "@/lib/db";

export async function POST(req) {
  await ensureTables();
  const body = await req.json();
  const { name, email, phone, password } = body;

  if (!name?.trim() || !email?.trim() || !password?.trim()) {
    return NextResponse.json({ error: "Name, email, and password are required." }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const existing = await query("SELECT id FROM users WHERE email = $1", [normalizedEmail]);
  if (existing.rows.length > 0) {
    return NextResponse.json({ error: "This email is already registered." }, { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const insertResult = await query(
    `INSERT INTO users (name, email, phone, password)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, phone, created_at`,
    [name.trim(), normalizedEmail, phone?.trim() || null, hashedPassword]
  );

  return NextResponse.json(insertResult.rows[0], { status: 201 });
}

export async function GET(req) {
  await ensureTables();
  const url = new URL(req.url);
  const email = url.searchParams.get("email");

  if (!email?.trim()) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const result = await query("SELECT id, name, email, phone, created_at FROM users WHERE email = $1", [email.trim().toLowerCase()]);
  if (result.rows.length === 0) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  return NextResponse.json(result.rows[0]);
}
