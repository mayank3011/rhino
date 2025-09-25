// app/api/debug/create-course/route.ts


import { NextResponse } from "next/server";
import connect from "../../../../lib/mongodb";
import Course, { ICourse } from "../../../../models/Course";

interface CreateCourseRequest {
  title?: string;
  description?: string;
  price?: number;
  image?: string;
  imagePublicId?: string;
  mentor?: {
    name: string;
    image: string;
    imagePublicId: string;
  };
  startTime?: string;
  duration?: string;
  keyOutcomes?: string[];
  modules?: unknown[];
}

interface CreateCourseResponse {
  ok: boolean;
  _id?: string;
  error?: string;
}

export async function POST(req: Request): Promise<NextResponse<CreateCourseResponse>> {
  const body: CreateCourseRequest = await req.json().catch(() => ({}));
  
  await connect();
  
  try {
    const created: ICourse = await Course.create({
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
    return NextResponse.json({ 
      ok: true, 
      _id: (created._id as { toString: () => string }).toString()
    });
  } catch (error) {
    console.error("DEBUG create failed:", error);
    const err = error as Error;
    return NextResponse.json(
      { ok: false, error: String(err.message ?? err) }, 
      { status: 500 }
    );
  }
}
