// app/api/admin/upload/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import streamifier from "streamifier";
import cloudinary from "../../../../lib/cloudinary";
import { verifyToken } from "../../../../lib/auth";

function uploadBufferToCloudinary(buffer: Buffer, filenamePrefix = "") {
  return new Promise<any>((resolve, reject) => {
    const uploadOptions: any = {
      folder: process.env.CLOUDINARY_UPLOAD_FOLDER || "rhino_courses",
      public_id: filenamePrefix ? `${filenamePrefix}-${Date.now()}` : `img-${Date.now()}`,
      resource_type: "image",
      overwrite: false,
      use_filename: true,
    };
    const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (err, res) => {
      if (err) return reject(err);
      resolve(res);
    });
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}

async function ensureAdmin() {
  const token = cookies().get(process.env.COOKIE_NAME || "token")?.value;
  if (!token) throw new Error("unauthenticated");
  const payload: any = verifyToken(token);
  if (!payload || payload.role !== "admin") throw new Error("forbidden");
  return payload;
}

export async function POST(req: Request) {
  try { await ensureAdmin(); } catch (err: any) {
    if (err.message === "unauthenticated") return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "File required" }, { status: 400 });
  if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Only images allowed" }, { status: 400 });

  const arr = await file.arrayBuffer();
  const buffer = Buffer.from(arr);
  try {
    const result = await uploadBufferToCloudinary(buffer, "course");
    return NextResponse.json({ ok: true, url: result.secure_url, public_id: result.public_id, width: result.width, height: result.height });
  } catch (err: any) {
    console.error("Upload error", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
