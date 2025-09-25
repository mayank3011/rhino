// app/course/[slug]/page.tsx
import React from "react";
import connect from "@/lib/mongodb";
import Course from "@/models/Course";
import Link from "next/link";
import Image from "next/image"; // Import Next.js Image
import CourseModules from "@/components/CourseModules"; // client component (has "use client")
import { Document } from "mongoose";

type Props = { params: { slug: string } };

// --- Constants (using Tailwind class colors) ---
const COLOR_PRIMARY = "indigo-600";
const COLOR_ACCENT = "violet-700";
const COLOR_CTA = "emerald-600";

// Define a minimal interface for the Course document fields this component uses
interface ICourseDocument extends Document {
  title: string;
  slug?: string;
  description?: string;
  longDescription?: string;
  price?: number;
  originalPrice?: number;
  duration?: string;
  image?: string;
  mentor?: {
    name?: string;
    image?: string;
    role?: string;
  };
  keyOutcomes?: string[];
  modules?: Array<{ title?: string; topics?: Array<{ text?: string }> }>;
  seats?: number | string;
  startTime?: string | Date;
}

// Interface for the sanitized course data passed to client components
interface IClientCourse {
  _id: string;
  slug: string;
  title: string;
  description: string;
  longDescription: string;
  image: string;
  price: number;
  originalPrice: number | null;
  duration: string;
  startTime: Date | null;
  mentor: ICourseDocument['mentor'] | null;
  keyOutcomes: string[];
  modules: ICourseDocument['modules'];
  seats: number | string | null;
}

function formatPrice(p?: number): string {
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
  let courseDoc: ICourseDocument | null = null;
  try {
    await connect();
    // Use type assertion for the mongoose query result
    courseDoc = (await Course.findOne({ slug: slugOrId }).lean()) as ICourseDocument | null;
    if (!courseDoc) {
      try {
        courseDoc = (await Course.findById(slugOrId).lean()) as ICourseDocument | null;
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
      <div className="container mx-auto p-8 max-w-4xl">
        <div className="bg-white p-8 rounded-xl shadow-xl border border-slate-200 text-center">
          <h2 className="text-2xl font-bold text-red-600">Course Not Found</h2>
          <p className="mt-2 text-base text-slate-600">The requested course <code>{slugOrId || "(empty)"}</code> could not be located.</p>
          <div className="mt-6 flex justify-center gap-4">
            <Link href="/courses" className={`px-4 py-2 bg-${COLOR_PRIMARY} text-white rounded-lg hover:bg-indigo-700 transition-colors`}>Browse Courses</Link>
          </div>
        </div>
      </div>
    );
  }

  // convert to plain JSON to safely pass to client components
  // Use a temporary interface/type assertion to cast the result from Mongoose/JSON operations
  const course: IClientCourse = JSON.parse(JSON.stringify(courseDoc));

  const title = course.title ?? "Untitled course";
  const description = course.description ?? "";
  const hero = course.image ?? "";
  const price = Number(course.price ?? 0);
  const originalPrice: number | null = course.originalPrice ?? null;
  const duration: string = course.duration ?? "";
  const startTime = course.startTime ? new Date(course.startTime) : null;
  const mentor = course.mentor ?? null;
  const keyOutcomes: string[] = Array.isArray(course.keyOutcomes) ? course.keyOutcomes.map(String) : [];
  const modules = Array.isArray(course.modules) ? course.modules : [];
  const seats = course.seats ?? null;
  const longDescription = course.longDescription ?? description ?? "";

  return (
    <div className="container mx-auto px-4 md:px-8 py-10">
      <div
        className="rounded-2xl p-4 md:p-8 border border-slate-100"
        style={{ background: "#f8f9fc" }} // Light gray/blue background
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

          {/* LEFT: hero + content */}
          <div className="lg:col-span-7 space-y-10">
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xl">
              <div className="flex flex-col md:flex-row items-stretch">
                
                {/* Image panel */}
                <div className="w-full md:w-1/2 p-6">
                  <div className="w-full h-64 md:h-72 rounded-lg border border-gray-200 overflow-hidden bg-slate-50 relative flex items-center justify-center">
                    {hero ? (
                      // 1. FIXED: Replaced <img> with Next.js <Image />
                      <Image src={hero} alt={title} fill className="object-cover" />
                    ) : (
                      <div className="text-slate-400 text-xl font-medium">Course Hero</div>
                    )}
                  </div>
                </div>

                {/* Title + meta */}
                <div className="w-full md:w-1/2 p-6">
                  <h1 className={`text-3xl font-extrabold leading-tight text-${COLOR_ACCENT}`}>
                    {title}
                  </h1>

                  {description && <p className="text-sm text-slate-600 mt-3">{description}</p>}

                  <div className="grid grid-cols-2 gap-4 mt-6 border-t border-b py-4 border-slate-100">
                    <div>
                      <div className="text-xs text-slate-500">Date</div>
                      <div className="text-sm font-semibold text-gray-800">{startTime ? startTime.toLocaleDateString() : "TBD"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Duration</div>
                      <div className="text-sm font-semibold text-gray-800">{duration || "—"}</div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="text-sm text-slate-700 mb-2 font-medium">Instructor</div>
                    {mentor ? (
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 ring-2 ring-white relative flex-shrink-0">
                          {mentor.image ? (
                            // 2. FIXED: Replaced <img> with Next.js <Image />
                            <Image src={mentor.image} alt={mentor.name ?? "mentor"} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-lg text-white font-bold bg-gray-400">
                              {(mentor.name || "?").slice(0, 1).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-base font-semibold text-slate-900">{mentor.name ?? "Instructor"}</div>
                          <div className="text-xs text-slate-500">{mentor.role ?? "Lead"}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-slate-500">No mentor listed</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* CTA row (visible below the fold, sticks to the course details) */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 p-4 bg-white rounded-xl border shadow-sm">
              <Link
                href={`/course/${encodeURIComponent(course.slug ?? course._id)}/register`}
                className={`inline-flex items-center justify-center px-8 py-3 rounded-xl text-xl font-bold shadow-lg w-full sm:w-auto transition bg-${COLOR_CTA} text-white hover:bg-emerald-700`}
              >
                Enroll Now
              </Link>

              <div className="flex items-baseline gap-4">
                {originalPrice ? <div className="text-base text-slate-400 line-through">₹{originalPrice.toLocaleString("en-IN")}</div> : null}
                <div className="text-4xl font-extrabold text-slate-900">{formatPrice(price)}</div>
              </div>
            </div>

            {/* Modules accordion (client-side animated) */}
            <div className="mt-8 bg-white p-6 rounded-xl shadow-lg border">
              <CourseModules modules={modules} accentColor={`#${COLOR_ACCENT.split('-')[1]}`} />
            </div>
          </div>

          {/* RIGHT: sticky info box */}
          <div className="lg:col-span-5">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 h-full flex flex-col gap-6 sticky top-24 shadow-2xl">
              <h2 className={`text-xl font-bold border-b pb-3 text-${COLOR_PRIMARY}`}>Course Overview</h2>
              <p className="text-slate-700 leading-relaxed text-base">{longDescription || description}</p>

              {Array.isArray(keyOutcomes) && keyOutcomes.length > 0 ? (
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3 border-b border-slate-100 pb-2">What you&apos;ll learn</h3>
                  <ul className="list-disc pl-5 text-slate-700 space-y-2 text-base">
                    {/* 3. FIXED: Removed 'any' in map callback */}
                    {keyOutcomes.map((o: string, i: number) => <li key={i}>{o}</li>)}
                  </ul>
                </div>
              ) : null}

              <div className="mt-auto pt-4 border-t border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-500">Seats remaining</div>
                  <div className={`text-base font-bold ${seats === "Limited" ? 'text-amber-600' : 'text-slate-900'}`}>{seats ?? "Unlimited"}</div>
                </div>

                <Link 
                  href={`/course/${encodeURIComponent(course.slug ?? course._id)}/register`} 
                  className={`inline-block w-full text-center px-4 py-2 border rounded-xl text-base font-medium bg-${COLOR_PRIMARY} text-white hover:bg-indigo-700 transition-colors`}
                >
                  Start Registration
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}