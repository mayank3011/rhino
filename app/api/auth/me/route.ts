// app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connect from "../../../../lib/mongodb";
import { verifyToken } from "../../../../lib/auth";
import User from "../../../../models/User";

export async function GET() {
  await connect();
  const token = (await cookies()).get(process.env.COOKIE_NAME || "token")?.value;
  if (!token) return NextResponse.json({ user: null });
  try {
    const payload: any = verifyToken(token);
    const user = await User.findById(payload.userId).lean();
    if (!user) return NextResponse.json({ user: null });
    return NextResponse.json({ user: { id: user._id, email: user.email, name: user.name, role: user.role }});
  } catch {
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
