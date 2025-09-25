// app/api/courses/[id]/route.ts
import { NextResponse, NextRequest } from "next/server";
import connect from "../../../../lib/mongodb";
import Course from "../../../../models/Course";
import { serializeDoc } from "../../../../utils/serialize";
import { Types } from "mongoose";

// Use the SerializedDocument type from the serialize utility
import type { SerializedDocument } from "../../../../utils/serialize";

// Use a RouteContext type where params is a Promise<{ id: string }>
interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  _req: NextRequest,
  context: RouteContext
): Promise<NextResponse<SerializedDocument | { error: string }>> {
  // Await the params because the validator expects params to be a Promise
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await connect();

  let course = null;
  try {
    course = await Course.findById(id).lean();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Database error";
    console.error("Course fetch error:", message);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  if (!course) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const serialized = serializeDoc(course);
  if (!serialized) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
  return NextResponse.json(serialized);
}
