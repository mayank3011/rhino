// app/api/debug/create-course/route.ts
import { NextResponse } from "next/server";
import connect from "../../../../lib/mongodb";
import Course from "../../../../models/Course";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  await connect();
  try {
    const created = await Course.create({
      title: body.title || `DEBUG ${Date.now()}`,
      description: body.description || "",
      price: typeof body.price === "number" ? body.price : 0,
      image: body.image || "",
      imagePublicId: body.imagePublicId || "",
      mentor: body.mentor ?? { name: "", image: "", imagePublicId: "" },
      startTime: body.startTime ? new Date(body.startTime) : null,
      duration: body.duration || "",
      keyOutcomes: Array.isArray(body.keyOutcomes) ? body.keyOutcomes : [],
      modules: Array.isArray(body.modules) ? body.modules : [],
    });
    console.log("DEBUG created:", created._id?.toString?.());
    return NextResponse.json({ ok: true, _id: created._id.toString() });
  } catch (err: any) {
    console.error("DEBUG create failed:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
