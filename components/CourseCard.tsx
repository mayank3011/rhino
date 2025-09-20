"use client";

import React from "react";
import Link from "next/link";

export type Mentor = { id?: string; name?: string; avatar?: string; role?: string };
export type Course = {
  _id?: string;
  title: string;
  slug?: string;
  excerpt?: string;
  duration?: string;
  price?: number;
  image?: string;
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
 * CourseCard - polished, tall card matching the screenshot
 */
export default function CourseCard({ course }: { course: Course }) {
  const { title, excerpt, duration, price, image, slug, mentors } = course;
  const href = `/course/${slug ?? course._id}`;

  // Mentor display helpers
  const primary = (mentors && mentors[0]) ?? null;
  const extras = (mentors && mentors.length > 1) ? mentors.slice(1) : [];
  const extraCount = mentors ? Math.max(0, mentors.length - 1) : 0;

  return (
    <article
      className="w-72 sm:w-80 md:w-80 flex-shrink-0 bg-white rounded-2xl border border-gray-400/90 hover:shadow-lg transform hover:-translate-y-0.5 transition-shadow transition-transform duration-150 overflow-hidden"
      role="group"
      aria-labelledby={`course-${course._id}-title`}
    >
      {/* Banner area (large, padded, can contain logo/illustration) */}
      <div className="bg-gray-50 px-6 py-6 h-36 flex items-center justify-center rounded-t-2xl">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={`${title} cover`}
            className="max-h-full max-w-full object-contain"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <div className="text-4xl font-bold text-gray-300">{(title || "C").slice(0, 1)}</div>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col justify-between h-[300px]">
        <div>
          <div className="flex items-start justify-between gap-3">
            <h3
              id={`course-${course._id}-title`}
              className="text-lg font-semibold text-gray-900 leading-snug max-w-[60%] line-clamp-2"
            >
              <Link href={href} className="hover:underline">
                {title}
              </Link>
            </h3>

            {/* subtle vertical divider area reserved or small tag */}
            <div className="text-xs text-gray-500 hidden sm:block">{/* optional tag */}</div>
          </div>

          {excerpt && (
            <p className="mt-3 text-sm text-gray-700 line-clamp-3">{excerpt}</p>
          )}

          <div className="mt-4 flex items-center gap-4 text-sm text-gray-700">
            <div className="inline-flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>{duration ?? "—"}</span>
            </div>
          </div>

          <div className="mt-4">
            <div className="text-xl font-semibold text-gray-900">{formatPrice(price)}</div>
          </div>
        </div>

        {/* Mentor row (bottom) */}
        <div className="mt-4 flex items-center justify-between">
          {/* Primary mentor */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white bg-gray-200 flex items-center justify-center">
              {primary?.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={primary.avatar} alt={primary.name} className="w-full h-full object-cover" />
              ) : (
                <div className="text-sm text-gray-700 font-medium">{primary?.name?.slice(0,1).toUpperCase() ?? "?"}</div>
              )}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-gray-900">{primary?.name ?? "Multiple mentors"}</div>
              <div className="text-xs text-gray-600 truncate">{primary?.role ?? (mentors && mentors.length > 1 ? "Multiple mentors" : "")}</div>
            </div>
          </div>

          {/* extra avatars cluster */}
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2 items-center">
              {extras.slice(0, 2).map((m, i) => (
                <div key={m.id ?? `${m.name}-${i}`} className="w-8 h-8 rounded-full ring-2 ring-white bg-gray-200 overflow-hidden">
                  {m.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-700 font-medium">{m.name?.slice(0,1).toUpperCase()}</div>
                  )}
                </div>
              ))}
            </div>

            {extraCount > 0 && (
              <div className="ml-1 inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-900 text-white text-xs font-medium ring-2 ring-white">
                +{extraCount}
              </div>
            )}
          </div>
        </div>

        {/* Bottom CTA row (optional) */}
        <div className="mt-4">
          <Link
            href={href}
            className="inline-flex items-center justify-center w-full px-3 py-2 text-sm font-medium rounded-md border border-gray-300 hover:bg-gray-50 text-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            View details
          </Link>
        </div>
      </div>
    </article>
  );
}
