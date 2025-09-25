// app/api/courses/route.ts


import { NextResponse } from "next/server";
import connect from "../../../lib/mongodb";
import Course, { ICourse } from "../../../models/Course";

interface CourseFilter {
  published: boolean;
  niche?: string;
  category?: string;
}

export async function GET(request: Request): Promise<NextResponse<ICourse[]>> {
  await connect();
  
  const url = new URL(request.url);
  const niche = url.searchParams.get("niche");
  const category = url.searchParams.get("category");
  const sort = url.searchParams.get("sort");

  const filter: CourseFilter = { published: true };
  if (niche) filter.niche = niche;
  if (category) filter.category = category;

  let query = Course.find(filter);
  
  if (sort === "price_asc") {
    query = query.sort({ price: 1 });
  } else if (sort === "price_desc") {
    query = query.sort({ price: -1 });
  } else {
    query = query.sort({ createdAt: -1 });
  }

  const docs: ICourse[] = await query.lean();
  return NextResponse.json(docs);
}