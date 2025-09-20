// app/api/courses/[slug]/route.ts
import { NextResponse } from "next/server";
import connect from "../../../../lib/mongodb";
import Course from "../../../../models/Course";
import { serializeDoc } from "../../../../utils/serialize";

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const { slug } = params;
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  await connect();

  // try slug first, then id fallback
  let course = await Course.findOne({ slug }).lean();
  if (!course) {
    try {
      course = await Course.findById(slug).lean();
    } catch (e) {
      // ignore invalid id parse
    }
  }

  if (!course) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const serialized = serializeDoc(course);
  return NextResponse.json(serialized);
}
