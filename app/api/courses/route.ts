// app/api/courses/route.ts
import { NextResponse } from "next/server";
import connect from "../../../lib/mongodb";
import Course from "../../../models/Course";

export async function GET(request: Request) {
  await connect();
  const url = new URL(request.url);
  const niche = url.searchParams.get("niche");
  const category = url.searchParams.get("category");
  const sort = url.searchParams.get("sort");

  const filter: any = { published: true };
  if (niche) filter.niche = niche;
  if (category) filter.category = category;

  let q = Course.find(filter);
  if (sort === "price_asc") q = q.sort({ price: 1 });
  else if (sort === "price_desc") q = q.sort({ price: -1 });
  else q = q.sort({ createdAt: -1 });

  const docs = await q.lean();
  return NextResponse.json(docs);
}
