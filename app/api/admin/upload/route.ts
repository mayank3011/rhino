// app/api/admin/upload/route.ts
import { NextResponse } from "next/server";
import cloudinary from "../../../../lib/cloudinary";
import { cookies } from "next/headers";
import { verifyToken } from "../../../../lib/auth";

// simple admin-only uploader that accepts a data URL (base64) or direct image URL
async function ensureAdmin() {
  const token = cookies().get(process.env.COOKIE_NAME || "token")?.value;
  if (!token) throw new Error("unauthenticated");
  const payload: any = verifyToken(token);
  if (!payload || payload.role !== "admin") throw new Error("forbidden");
  return payload;
}

export async function POST(req: Request) {
  try {
    await ensureAdmin();
  } catch (e: any) {
    const msg = e?.message || "Not authorized";
    const status = String(msg).toLowerCase().includes("unauthenticated") ? 401 : 403;
    return NextResponse.json({ error: msg }, { status });
  }

  const body = await req.json().catch(() => ({}));
  const dataUrl = body.dataUrl || body.url || body.file;
  if (!dataUrl) return NextResponse.json({ error: "dataUrl required" }, { status: 400 });

  try {
    const res: any = await cloudinary.uploader.upload(dataUrl, {
      folder: "rhino_courses",
      resource_type: "image",
      overwrite: true,
    });
    return NextResponse.json({ url: res.secure_url || res.url, public_id: res.public_id });
  } catch (err: any) {
    console.error("cloudinary upload error:", err);
    return NextResponse.json({ error: err?.message || "Upload failed" }, { status: 500 });
  }
}
