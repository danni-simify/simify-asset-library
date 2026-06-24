import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const expected = process.env.SITE_PASSWORD;
  const { password, from } = (await req.json().catch(() => ({}))) as {
    password?: string;
    from?: string;
  };

  if (!expected) {
    return NextResponse.json(
      { ok: false, error: "Site password is not configured." },
      { status: 500 }
    );
  }

  if (!password || password !== expected) {
    return NextResponse.json(
      { ok: false, error: "Incorrect password." },
      { status: 401 }
    );
  }

  const res = NextResponse.json({ ok: true, redirect: from || "/" });
  res.cookies.set(AUTH_COOKIE, expected, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return res;
}
