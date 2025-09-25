// app/api/courses/[id]/route.ts
import { NextResponse } from "next/server";
import connect from "../../../../lib/mongodb";
import Course from "../../../../models/Course";
import { serializeDoc } from "../../../../utils/serialize";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await connect();

  let course = null;
  try {
    course = await Course.findById(id).lean();
  } catch (e) {
    // invalid id format or not found
  }

  if (!course) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const serialized = serializeDoc(course);
  return NextResponse.json(serialized);
}
