// app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import connect from "../../../../lib/mongodb";
import User from "../../../../models/User";
import bcrypt from "bcryptjs";
import { signToken } from "../../../../lib/auth";

export async function POST(req: Request) {
  await connect();
  const { email, password } = await req.json();
  const user = await User.findOne({ email }).lean();
  if (!user) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  const valid = await bcrypt.compare(password, user.passwordHash || "");
  if (!valid) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  const token = signToken({ userId: user._id, role: user.role, email: user.email });
  const res = NextResponse.json({ ok: true, role: user.role });
  res.cookies.set({ name: process.env.COOKIE_NAME || "token", value: token, httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 7, secure: process.env.NODE_ENV === "production", sameSite: "lax" });
  return res;
}
