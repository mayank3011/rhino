// app/courses/page.tsx
import React from "react";
import Link from "next/link";
import CourseCard from "@/components/CourseCard";
import connect from "@/lib/mongodb";
import Course from "@/models/Course";
import type { FilterQuery } from "mongoose";

// Layout constants
const DEFAULT_LIMIT = 12;
const PRIMARY_BUTTON_CLASSES =
  "bg-indigo-600 text-white px-4 py-2 rounded-lg text-base font-medium hover:bg-indigo-700 transition-colors flex-shrink-0";
const ACCENT_BUTTON_CLASSES =
  "bg-emerald-600 text-white px-4 py-2 rounded-lg text-base font-medium hover:bg-emerald-700 transition-colors flex-shrink-0";

// Plain/lean course shape (what we expect from .lean())
interface ICourseLean {
  _id: string | { toString(): string };
  title?: string;
  slug?: string | null;
  niche?: string;
  description?: string;
  duration?: string;
  price?: number | string;
  image?: string;
  mentor?: {
    _id?: string | { toString(): string };
    id?: string;
    name?: string;
    image?: string;
  } | null;
  published?: boolean;
  createdAt?: Date | string;
}

// Props passed to CourseCard component (client-side)
interface IPlainCourse {
  _id: string;
  title: string;
  slug?: string;
  excerpt: string;
  duration?: string;
  price: number;
  image?: string;
  mentors: { id?: string; name?: string; avatar?: string }[];
}

type Props = {
  searchParams?: { page?: string; q?: string; limit?: string };
};

export default async function CoursesPage({ searchParams }: Props) {
  const page = Math.max(1, Number(searchParams?.page ?? 1));
  const q = (searchParams?.q ?? "").trim();
  const limit = Math.max(6, Math.min(48, Number(searchParams?.limit ?? DEFAULT_LIMIT)));
  const skip = (page - 1) * limit;

  await connect();

  // Build typed filter
  const filter: FilterQuery<ICourseLean> = { published: true };

  if (q) {
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(escaped, "i");
    // $or isn't directly expressible in the FilterQuery generic here, assign with a safe unknown-based cast:
    (filter as FilterQuery<ICourseLean & { $or?: unknown }>).$or = [{ title: re }, { niche: re }, { description: re }];
  }

  // Query the database: .lean() returns plain objects; assert returned type to ICourseLean[]
  const [total, docs] = await Promise.all([
    Course.countDocuments(filter as FilterQuery<ICourseLean>),
    Course.find(filter as FilterQuery<ICourseLean>)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean() as Promise<ICourseLean[]>,
  ]);

  const pages = Math.max(1, Math.ceil(total / limit));

  // Normalize to IPlainCourse (no null, only undefined)
  const plainCourses: IPlainCourse[] = (docs || []).map((c) => {
    const idStr = c._id && typeof c._id === "object" && "toString" in c._id ? c._id.toString() : String(c._id ?? "");
    const mentor = c.mentor ?? null;

    const mentors = mentor
      ? [
          {
            id:
              mentor._id && typeof mentor._id === "object" && "toString" in mentor._id
                ? mentor._id.toString()
                : mentor._id
                ? String(mentor._id)
                : mentor.id ?? undefined,
            name: mentor.name ?? undefined,
            avatar: mentor.image ?? undefined,
          },
        ]
      : [];

    return {
      _id: idStr,
      title: String(c.title ?? ""),
      // convert null -> undefined to match CourseCard typings
      slug: c.slug ? String(c.slug) : undefined,
      excerpt: c.description ? String(c.description).slice(0, 180) : "",
      duration: c.duration ?? undefined,
      price: typeof c.price === "number" ? c.price : Number(c.price ?? 0),
      image: c.image ?? undefined,
      mentors,
    };
  });

  return (
    <main className="container mx-auto px-4 py-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">All Courses</h1>
          <p className="text-base text-slate-600 mt-1">
            Found {total} courses — Page {page} of {pages}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <form action="/courses" method="get" className="flex items-center gap-2 flex-grow">
            <input
              name="q"
              defaultValue={q}
              placeholder="Search courses..."
              className="px-4 py-2 border border-slate-300 rounded-lg text-base flex-grow min-w-[150px]"
            />
            <button type="submit" className={PRIMARY_BUTTON_CLASSES}>
              Search
            </button>
          </form>

          <Link href="/course/create" className={`${ACCENT_BUTTON_CLASSES} hidden md:inline-flex items-center`}>
            + New Course
          </Link>
        </div>
      </div>

      {plainCourses.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-xl text-slate-600 shadow-lg">
          No courses found matching your search or filters.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {plainCourses.map((c) => (
              <CourseCard key={c._id} course={c} />
            ))}
          </div>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 pt-4">
            <div className="text-base text-slate-600">
              Showing {skip + 1}–{Math.min(skip + plainCourses.length, total)} of {total} results
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/courses?page=${Math.max(1, page - 1)}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                className={`px-4 py-2 border rounded-lg font-medium transition-colors ${
                  page <= 1 ? "opacity-40 cursor-not-allowed text-slate-500" : "text-indigo-600 hover:bg-slate-50"
                }`}
              >
                ← Prev
              </Link>

              <div className="px-4 py-2 border border-slate-300 rounded-lg text-base font-medium bg-slate-50">Page {page}</div>

              <Link
                href={`/courses?page=${Math.min(pages, page + 1)}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                className={`px-4 py-2 border rounded-lg font-medium transition-colors ${
                  page >= pages ? "opacity-40 cursor-not-allowed text-slate-500" : "text-indigo-600 hover:bg-slate-50"
                }`}
              >
                Next →
              </Link>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
