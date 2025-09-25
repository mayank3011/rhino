// app/api/admin/upload/route.ts
import { NextResponse } from "next/server";
import cloudinary from "cloudinary";

// configure cloudinary using env
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const dataUrl = body?.dataUrl;
    if (!dataUrl) return NextResponse.json({ error: "dataUrl required" }, { status: 422 });

    // cloudinary can accept data URLs directly
    const res = await cloudinary.v2.uploader.upload(dataUrl, { folder: "courses" });
    return NextResponse.json({ url: res.secure_url || res.url, public_id: res.public_id });
  } catch (err: any) {
    console.error("upload error", err);
    return NextResponse.json({ error: err?.message || "Upload failed" }, { status: 500 });
  }
}
