// app/api/profile/update/route.ts

import { NextResponse } from "next/server";
import connect from "@/lib/mongodb";
import User from "@/models/User";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

interface TokenPayload {
  id: string;
  userId?: string;
}

interface UpdateProfileRequest {
  name?: string;
}

interface UpdateProfileResponse {
  ok?: boolean;
  error?: string;
}

export async function PUT(req: Request): Promise<NextResponse<UpdateProfileResponse>> {
  try {
    const token = (await cookies()).get(process.env.COOKIE_NAME || "token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const payload = verifyToken(token) as TokenPayload;
    if (!payload?.id) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body: UpdateProfileRequest = await req.json().catch(() => ({}));
    const { name } = body || {};
    
    if (!name?.trim()) {
      return NextResponse.json({ error: "Name required" }, { status: 422 });
    }

    await connect();
    await User.updateOne(
      { _id: payload.id }, 
      { $set: { name: name.trim() } }
    );
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("profile update error", error);
    const err = error as Error;
    return NextResponse.json(
      { error: String(err?.message ?? err) }, 
      { status: 500 }
    );
  }
}