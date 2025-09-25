//app/api/admin/promocodes/route.ts
import { NextRequest, NextResponse } from "next/server";
import connect from "@/lib/mongodb";
import PromoCode from "@/models/PromoCode";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

// Types
interface AuthPayload {
  role: string;
  userId: string;
  email: string;
}

interface ErrorResponse {
  error: string;
  message?: string;
  details?: string;
}

/** Authentication middleware */
async function ensureAdmin(): Promise<AuthPayload> {
  const token = (await cookies()).get(process.env.COOKIE_NAME || "token")?.value;
  if (!token) throw new Error("unauthenticated");

  const payload = verifyToken(token) as AuthPayload | null;
  if (!payload || payload.role !== "admin") throw new Error("forbidden");

  return payload;
}

/** Error handler for consistent API responses */
function handleError(error: unknown, defaultMessage = "An error occurred"): NextResponse<ErrorResponse> {
  const message = error instanceof Error ? error.message : defaultMessage;
  console.error("Promocode API Error:", error);

  if (message === "unauthenticated") {
    return NextResponse.json({
      error: "Authentication required",
      message: "Please log in to continue"
    }, { status: 401 });
  }

  if (message === "forbidden") {
    return NextResponse.json({
      error: "Admin access required",
      message: "Insufficient permissions"
    }, { status: 403 });
  }

  return NextResponse.json({
    error: "server_error",
    message: message,
    details: error instanceof Error ? error.stack : String(error)
  }, { status: 500 });
}

/** GET - Retrieve all promocodes */
export async function GET(): Promise<NextResponse> {
  try {
    await ensureAdmin();
    await connect();
    const promoCodes = await PromoCode.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json(promoCodes);
  } catch (error) {
    return handleError(error, "Failed to fetch promocodes");
  }
}

/** POST - Create a new promocode */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    await ensureAdmin();
    const body = await req.json();

    await connect();

    const newPromoCode = await PromoCode.create({
      code: String(body.code).toUpperCase().trim(),
      discountType: body.discountType,
      amount: Number(body.amount),
      expiresAt: body.expiresAt || null,
      active: !!body.active,
    });

    return NextResponse.json(newPromoCode, { status: 201 });
  } catch (error) {
    return handleError(error, "Failed to create promocode");
  }
}
