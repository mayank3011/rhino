// app/courses/page.tsx
import React from "react";
import Link from "next/link";
import CourseCard from "@/components/CourseCard";
import connect from "@/lib/mongodb";
import Course from "@/models/Course";

type Props = {
  searchParams?: { page?: string; q?: string; limit?: string };
};

const DEFAULT_LIMIT = 12;

export default async function CoursesPage({ searchParams }: Props) {
  const page = Math.max(1, Number(searchParams?.page ?? 1));
  const q = (searchParams?.q ?? "").trim();
  const limit = Math.max(6, Math.min(48, Number(searchParams?.limit ?? DEFAULT_LIMIT)));
  const skip = (page - 1) * limit;

  await connect();

  const filter: any = { published: true };
  if (q) {
    const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ title: re }, { niche: re }, { description: re }];
  }

  const [total, docs] = await Promise.all([
    Course.countDocuments(filter),
    Course.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(), // lean() gives plain POJOs already, but double-serialize below for safety
  ]);

  const pages = Math.max(1, Math.ceil(total / limit));

  // Ensure everything passed to client components are plain values (no ObjectId, no toJSON)
  // Build the list of simple course objects for CourseCard
  const plainCourses = (docs || []).map((c: any) => {
    // Some mongoose lean() returns ObjectIds inside nested fields; normalize everything.
    const serialized = JSON.parse(JSON.stringify(c || {}));

    return {
      _id: String(serialized._id ?? ""),
      title: String(serialized.title ?? ""),
      slug: serialized.slug ?? null,
      excerpt: serialized.description ? String(serialized.description).slice(0, 180) : "",
      duration: serialized.duration ?? "",
      price: typeof serialized.price === "number" ? serialized.price : Number(serialized.price ?? 0),
      image: serialized.image ?? "",
      // mentor(s) — convert to simple array with minimal fields
      mentors: serialized.mentor
        ? [{ id: serialized.mentor._id ? String(serialized.mentor._id) : serialized.mentor.id ?? "", name: serialized.mentor.name ?? "", avatar: serialized.mentor.image ?? "" }]
        : [],
    };
  });

  return (
    <main className="container mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Courses</h1>
          <p className="text-sm text-slate-600 mt-1">Browse courses — page {page} of {pages}</p>
        </div>

        <div className="flex items-center gap-3">
          <form action="/courses" method="get" className="flex items-center gap-2">
            <input name="q" defaultValue={q} placeholder="Search courses" className="px-3 py-2 border rounded-md text-sm" />
            <button type="submit" className="px-3 py-2 bg-indigo-600 text-white rounded-md text-sm">Search</button>
          </form>
          <Link href="/course/create" className="hidden sm:inline-flex items-center px-3 py-2 bg-emerald-600 text-white rounded-md text-sm">Create Course</Link>
        </div>
      </div>

      {plainCourses.length === 0 ? (
        <div className="bg-white border rounded p-6 text-center text-slate-600">No courses found.</div>
      ) : (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {plainCourses.map((c) => (
              // pass only plain-course object
              <CourseCard key={c._id} course={c} />
            ))}
          </div>

          <div className="mt-8 flex items-center justify-between">
            <div className="text-sm text-slate-600">Showing {(skip + 1)}–{Math.min(skip + plainCourses.length, total)} of {total}</div>

            <div className="flex items-center gap-2">
              <Link
                href={`/courses?page=${Math.max(1, page - 1)}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                className={`px-3 py-1 border rounded ${page <= 1 ? "opacity-50 pointer-events-none" : ""}`}
              >
                Prev
              </Link>
              <div className="px-3 py-1 border rounded text-sm bg-white">Page {page}</div>
              <Link
                href={`/courses?page=${Math.min(pages, page + 1)}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                className={`px-3 py-1 border rounded ${page >= pages ? "opacity-50 pointer-events-none" : ""}`}
              >
                Next
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
