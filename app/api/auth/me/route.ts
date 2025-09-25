// app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connect from "../../../../lib/mongodb";
import { verifyToken } from "../../../../lib/auth";
import User, { IUser } from "../../../../models/User";

interface TokenPayload {
  userId: string;
  role?: string;
}

interface UserResponse {
  user: {
    id: string;
    email: string;
    name?: string;
    role: string;
  } | null;
}

export async function GET(): Promise<NextResponse<UserResponse>> {
  await connect();
  
  const token = (await cookies()).get(process.env.COOKIE_NAME || "token")?.value;
  if (!token) {
    return NextResponse.json({ user: null });
  }

  try {
    const payload = verifyToken(token) as TokenPayload;
    const user: IUser | null = await User.findById(payload.userId).lean();
    
    if (!user) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({ 
      user: { 
        id: user._id.toString(), 
        email: user.email, 
        name: user.name, 
        role: user.role 
      }
    });
  } catch (error) {
    console.error("Auth verification error:", error);
    return NextResponse.json({ user: null }, { status: 401 });
  }
}