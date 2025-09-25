// app/api/admin/promocodes/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import connect from "@/lib/mongodb";
import PromoCode from "@/models/PromoCode";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import mongoose from "mongoose";

/** --- Types --- */
interface AuthPayload {
  role: string;
  userId: string;
  email: string;
}

interface DeleteResponse {
  success: boolean;
  message: string;
  deletedId?: string;
}

interface ErrorResponse {
  error: string;
  message?: string;
  details?: string;
}

/** Shape for Lean promo code doc (only fields we use) */
interface PromoCodeDto {
  _id: mongoose.Types.ObjectId | string;
  code?: string;
  discount?: number;
  type?: string;
  active?: boolean;
  expiresAt?: Date | string | null;
  usedBy?: unknown[] | null;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
}

/** --- Helpers --- */

async function ensureAdmin(): Promise<AuthPayload> {
  const token = (await cookies()).get(process.env.COOKIE_NAME || "token")?.value;
  if (!token) throw new Error("unauthenticated");

  const payload = verifyToken(token) as AuthPayload | null;
  if (!payload || payload.role !== "admin") throw new Error("forbidden");

  return payload;
}

function handleError(error: unknown, defaultMessage = "An error occurred"): NextResponse<ErrorResponse> {
  const message = error instanceof Error ? error.message : defaultMessage;
  console.error("Promocode API Error:", error);

  if (message === "unauthenticated") {
    return NextResponse.json({ error: "Authentication required", message: "Please log in to continue" }, { status: 401 });
  }
  if (message === "forbidden") {
    return NextResponse.json({ error: "Admin access required", message: "Insufficient permissions" }, { status: 403 });
  }

  return NextResponse.json({ error: "server_error", message, details: error instanceof Error ? error.stack : String(error) }, { status: 500 });
}

function toStringSafe(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  if (typeof v === "string") return v;
  if (typeof v === "object") {
    try {
      return (v as { toString?: () => string }).toString?.() ?? String(v);
    } catch {
      return null;
    }
  }
  return String(v);
}

function toISOStringSafe(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "string") {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }
  if (typeof v === "object") {
    try {
      return (v as { toISOString?: () => string }).toISOString?.() ?? null;
    } catch {
      return null;
    }
  }
  return null;
}

/** --- DELETE --- */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<DeleteResponse | ErrorResponse>> {
  try {
    await ensureAdmin();
    const { id } = await params;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Invalid request", message: "Promocode ID is required" }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID format", message: "The provided promocode ID is not valid" }, { status: 422 });
    }

    await connect();
    const deletedPromoCode = await PromoCode.findByIdAndDelete(id);

    if (!deletedPromoCode) {
      return NextResponse.json({ error: "Not found", message: "Promocode not found or already deleted" }, { status: 404 });
    }

    // deletedPromoCode is a Mongoose Document — use toObject() to get plain shape
    const deletedPlain = (typeof (deletedPromoCode as { toObject?: () => unknown }).toObject === "function")
      ? ((deletedPromoCode as { toObject: () => unknown }).toObject() as unknown as PromoCodeDto)
      : (deletedPromoCode as unknown as PromoCodeDto);

    return NextResponse.json({ success: true, message: "Promocode deleted successfully", deletedId: toStringSafe(deletedPlain._id) ?? id });
  } catch (error) {
    return handleError(error, "Failed to delete promocode");
  }
}

/** --- GET --- */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    await ensureAdmin();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 422 });
    }

    await connect();

    // Use lean() so we get a plain object that matches PromoCodeDto shape
    const promoDoc = await PromoCode.findById(id).lean();

    if (!promoDoc) {
      return NextResponse.json({ error: "Promocode not found" }, { status: 404 });
    }

    const promo = promoDoc as unknown as PromoCodeDto;

    const resp = {
      _id: toStringSafe(promo._id),
      code: promo.code ?? "",
      discount: typeof promo.discount === "number" ? promo.discount : 0,
      type: promo.type ?? "percentage",
      active: typeof promo.active === "boolean" ? promo.active : Boolean(promo.active),
      expiresAt: toISOStringSafe(promo.expiresAt),
      usedBy: Array.isArray(promo.usedBy) ? promo.usedBy : [],
      createdAt: toISOStringSafe(promo.createdAt),
      updatedAt: toISOStringSafe(promo.updatedAt),
    };

    return NextResponse.json(resp);
  } catch (error) {
    return handleError(error, "Failed to fetch promocode");
  }
}
