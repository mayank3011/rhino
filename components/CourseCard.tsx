// components/CourseCard.tsx
"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image"; // Import Next.js Image component

// --- Constants based on Logo Colors ---
const COLOR_PRIMARY = "indigo-600";
const COLOR_ACCENT = "emerald-600";

export type Mentor = { id?: string; name?: string; avatar?: string; role?: string };
export type Course = {
  _id?: string;
  title: string;
  excerpt?: string;
  duration?: string;
  price?: number;
  image?: string;
  slug?: string; // Explicitly define slug in type
  mentors?: Mentor[];
};

function formatPrice(p?: number) {
  if (p == null || p === 0) return "Free";
  try {
    return `₹${Number(p).toLocaleString("en-IN")}`;
  } catch {
    return `₹${p}`;
  }
}

/**
 * CourseCard - polished, responsive card
 */
export default function CourseCard({ course }: { course: Course }) {
  // 1. Fix: Removed 'slug' from destructuring to resolve unused variable warning.
  const { title, excerpt, duration, price, image, mentors } = course; 
  const href = `/course/${course.slug ?? course._id}`;

  // Mentor display helpers
  const primary = (mentors && mentors[0]) ?? null;
  const extras = (mentors && mentors.length > 1) ? mentors.slice(1) : [];
  const extraCount = mentors ? Math.max(0, mentors.length - 1) : 0;

  return (
    <article
      className="w-full max-w-sm flex-shrink-0 bg-white rounded-2xl border border-slate-200 shadow-lg transform hover:-translate-y-0.5 transition-shadow transition-transform duration-200 overflow-hidden"
      role="group"
      aria-labelledby={`course-${course._id}-title`}
    >
      <Link href={href} className="block">
        {/* Banner area (using relative container for Next/Image) */}
        <div className="bg-slate-50 relative w-full h-40 flex items-center justify-center rounded-t-2xl">
          {image ? (
            // 2. Replaced <img> with Next.js <Image />
            <Image
              src={image}
              alt={`${title} cover`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 300px" // Responsive image sizing
            />
          ) : (
            <div className={`w-full h-full flex items-center justify-center bg-${COLOR_PRIMARY}/10`}>
              <div className="text-5xl font-bold text-gray-400">{(title || "C").slice(0, 1)}</div>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col justify-between h-[300px]">
          <div>
            {/* Title */}
            <h3
              id={`course-${course._id}-title`}
              className={`text-xl font-bold text-gray-900 leading-snug line-clamp-2 hover:text-${COLOR_PRIMARY} transition-colors`}
            >
              {title}
            </h3>

            {/* Excerpt */}
            {excerpt && (
              <p className="mt-2 text-sm text-gray-700 line-clamp-3">{excerpt}</p>
            )}

            {/* Duration */}
            <div className="mt-4 flex items-center gap-2 text-sm font-medium text-gray-700">
              <svg className={`w-4 h-4 text-${COLOR_PRIMARY}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12 8v4l3 3" />
              </svg>
              <span>{duration ?? "Duration TBD"}</span>
            </div>

            {/* Price */}
            <div className="mt-4">
              <div className={`text-2xl font-extrabold text-${COLOR_PRIMARY}`}>{formatPrice(price)}</div>
            </div>
          </div>

          {/* Mentor row (bottom) */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            {/* Primary mentor */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white bg-gray-200 flex items-center justify-center flex-shrink-0">
                {primary?.avatar ? (
                  // 3. Replaced <img> with Next.js <Image />
                  <Image src={primary.avatar} alt={primary.name || "Mentor"} width={40} height={40} className="object-cover" />
                ) : (
                  <div className={`text-sm text-gray-700 font-medium bg-${COLOR_PRIMARY}/10 w-full h-full flex items-center justify-center`}>
                    {primary?.name?.slice(0,1).toUpperCase() ?? "?"}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-900 truncate">{primary?.name ?? "Multiple mentors"}</div>
                <div className="text-xs text-gray-600 truncate">{primary?.role ?? (mentors && mentors.length > 1 ? "Lead Instructor" : "Instructor")}</div>
              </div>
            </div>

            {/* extra avatars cluster */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex -space-x-2 items-center">
                {extras.slice(0, 2).map((m, i) => (
                  <div key={m.id ?? `${m.name}-${i}`} className="w-8 h-8 rounded-full ring-2 ring-white bg-gray-200 overflow-hidden">
                    {m.avatar ? (
                      // 4. Replaced <img> with Next.js <Image />
                      <Image src={m.avatar} alt={m.name || "Co-mentor"} width={32} height={32} className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-700 font-medium">{m.name?.slice(0,1).toUpperCase()}</div>
                    )}
                  </div>
                ))}
              </div>

              {extraCount > 0 && (
                // Highlighted mentor count in accent color
                <div className={`ml-1 inline-flex items-center justify-center w-8 h-8 rounded-full bg-${COLOR_ACCENT} text-white text-xs font-bold ring-2 ring-white`}>
                  +{extraCount}
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}