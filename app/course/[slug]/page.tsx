// app/course/[slug]/page.tsx
import React from "react";
import connect from "@/lib/mongodb";
import Course from "@/models/Course";
import { notFound } from "next/navigation";
import Link from "next/link";
import CourseModules from "@/components/CourseModules"; // client component (has "use client")

type Props = { params: { slug: string } };

const LOGO_PRIMARY = "#5b2bff"; // purple-ish from logo
const LOGO_ACCENT = "#2b2bff"; // bluish accent

function formatPrice(p?: number) {
  if (p == null || p === 0) return "Free";
  try {
    return `₹${Number(p).toLocaleString("en-IN")}`;
  } catch {
    return `₹${p}`;
  }
}

export default async function CourseDetailPage({ params }: Props) {
  const slugOrId = String(params?.slug ?? "").trim();

  // connect & load course
  let courseDoc: any = null;
  try {
    await connect();
    courseDoc = await Course.findOne({ slug: slugOrId }).lean();
    if (!courseDoc) {
      try {
        courseDoc = await Course.findById(slugOrId).lean();
      } catch {
        courseDoc = null;
      }
    }
  } catch (err) {
    console.error("Course fetch error:", err);
    courseDoc = null;
  }

  if (!courseDoc) {
    // dev-friendly not found — you can change to notFound() in production
    return (
      <div className="container mx-auto p-8">
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-semibold">Course not found</h2>
          <p className="mt-2 text-sm text-slate-600">Requested: <code>{slugOrId || "(empty)"}</code></p>
          <div className="mt-4 flex gap-2">
            <Link href="/courses" className="px-3 py-2 bg-indigo-600 text-white rounded">Browse courses</Link>
            <Link href="/admin/courses" className="px-3 py-2 border rounded">Admin</Link>
          </div>
        </div>
      </div>
    );
  }

  // convert to plain JSON to safely pass to client components
  const course = JSON.parse(JSON.stringify(courseDoc));

  const title = course.title ?? "Untitled course";
  const description = course.description ?? "";
  const hero = course.image ?? "";
  const price = Number(course.price ?? 0);
  const originalPrice: number | null = course.originalPrice ?? null;
  const duration: string = course.duration ?? "";
  const startTime = course.startTime ? new Date(course.startTime) : null;
  const mentor = course.mentor ?? null;
  const keyOutcomes: string[] = Array.isArray(course.keyOutcomes) ? course.keyOutcomes : [];
  const modules = Array.isArray(course.modules) ? course.modules : [];
  const seats = course.seats ?? null;
  const longDescription = course.longDescription ?? description ?? "";

  return (
    <div className="container mx-auto px-4 md:px-8 py-10">
      <div
        className="rounded-2xl p-4 md:p-8"
        style={{ background: "#faf7ff" }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* LEFT: hero + register */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="flex flex-col md:flex-row items-stretch">
                {/* Image panel (large) */}
                <div className="w-full md:w-1/2 p-6">
                  <div className="w-full h-64 md:h-72 rounded-lg border border-gray-200 overflow-hidden bg-slate-50 flex items-center justify-center">
                    {hero ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={hero} alt={title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-slate-400 text-lg">No image</div>
                    )}
                  </div>
                </div>

                {/* Title + meta */}
                <div className="w-full md:w-1/2 p-6">
                  <h1 className="text-2xl md:text-3xl font-bold leading-tight" style={{ color: LOGO_PRIMARY }}>
                    {title}
                  </h1>

                  {description ? <p className="text-sm text-slate-600 mt-3">{description}</p> : null}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                    <div>
                      <div className="text-xs text-slate-500">Date for Workshop</div>
                      <div className="text-sm font-semibold">{startTime ? startTime.toLocaleDateString() : "Coming Soon"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Time for Workshop</div>
                      <div className="text-sm font-semibold">{startTime ? startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "7 PM IST"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Duration</div>
                      <div className="text-sm font-semibold">{duration || "—"}</div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="text-sm text-slate-700 mb-2">Mentors</div>
                    {mentor ? (
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 ring-2 ring-white">
                          {mentor.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={mentor.image} alt={mentor.name ?? "mentor"} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-sm text-slate-700 font-medium">
                              {(mentor.name || "?").slice(0, 1).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{mentor.name ?? "Instructor"}</div>
                          <div className="text-xs text-slate-500">{mentor.role ?? ""}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-slate-500">No mentor listed</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* CTA row */}
            <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
              <Link
                href={`/course/${encodeURIComponent(course.slug ?? course._id)}/register`}
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg text-lg font-medium shadow-md transition"
                style={{ background: LOGO_PRIMARY, color: "white" }}
              >
                Register Now <span className="ml-2">→</span>
              </Link>

              <div className="flex items-baseline gap-4">
                {originalPrice ? <div className="text-sm text-slate-400 line-through">₹{originalPrice.toLocaleString("en-IN")}</div> : null}
                <div className="text-3xl font-extrabold text-slate-900">{formatPrice(price)}</div>
              </div>
            </div>

            {/* Modules accordion (client-side animated) */}
            <div className="mt-8">
              <CourseModules modules={modules} accentColor={LOGO_ACCENT} />
            </div>
          </div>

          {/* RIGHT: sticky info box */}
          <div className="lg:col-span-5">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 h-full flex flex-col gap-4 sticky top-24">
              <h2 className="text-xl font-semibold" style={{ color: LOGO_PRIMARY }}>About this course</h2>
              <p className="text-slate-700 leading-relaxed">{longDescription}</p>

              {Array.isArray(keyOutcomes) && keyOutcomes.length ? (
                <div>
                  <h3 className="text-sm font-medium text-slate-900 mb-2">What you'll learn</h3>
                  <ul className="list-disc pl-5 text-slate-700 space-y-1">
                    {keyOutcomes.map((o: any, i: number) => <li key={i}>{String(o)}</li>)}
                  </ul>
                </div>
              ) : null}

              <div className="mt-auto pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-500">Seats</div>
                  <div className="text-sm font-semibold text-slate-900">{seats ?? "Limited"}</div>
                </div>

                <div className="mt-3">
                  <Link href={`/register?course=${encodeURIComponent(course.slug ?? course._id)}`} className="inline-block px-4 py-2 border rounded-md text-sm hover:bg-slate-50">
                    Reserve spot
                  </Link>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
