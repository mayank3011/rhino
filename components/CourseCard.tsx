// components/CourseCard.tsx
"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

export type Mentor = { id?: string; name?: string; avatar?: string; role?: string };
export type Course = {
  _id?: string;
  title: string;
  excerpt?: string;
  duration?: string;
  price?: number;
  image?: string;
  slug?: string;
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

export default function CourseCard({ course }: { course: Course }) {
  const { title, excerpt, duration, price, image, mentors } = course;
  const href = `/course/${course.slug ?? course._id}`;

  const primary = (mentors && mentors[0]) ?? null;
  const extras = mentors && mentors.length > 1 ? mentors.slice(1) : [];
  const extraCount = mentors ? Math.max(0, mentors.length - 1) : 0;

  return (
    <article
      className="
        group w-full max-w-full
        rounded-2xl border border-slate-200 bg-white shadow-sm
        transition hover:shadow-md focus-within:shadow-md
      "
    >
      <Link
        href={href}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 rounded-2xl"
        aria-labelledby={`course-${course._id ?? course.slug}-title`}
      >
        {/* Banner */}
        <div className="relative w-full aspect-[16/9] overflow-hidden rounded-t-2xl bg-slate-100">
          {image ? (
            <Image
              src={image}
              alt={`${title} cover`}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              priority={false}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center text-2xl font-bold">
                {(title || "C").slice(0, 1).toUpperCase()}
              </div>
            </div>
          )}

          {/* Price chip */}
          <div className="absolute bottom-3 left-3 inline-flex items-center rounded-full bg-white/90 backdrop-blur px-3 py-1 text-sm font-semibold text-slate-900 ring-1 ring-slate-200">
            {formatPrice(price)}
          </div>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5">
          {/* Title */}
          <h3
            id={`course-${course._id ?? course.slug}-title`}
            className="text-lg sm:text-xl font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-indigo-700 transition-colors"
          >
            {title}
          </h3>

          {/* Excerpt */}
          {excerpt ? (
            <p className="mt-2 text-sm text-slate-700 line-clamp-3">{excerpt}</p>
          ) : null}

          {/* Meta row */}
          <div className="mt-4 flex items-center gap-3 text-sm text-slate-700">
            <span className="inline-flex items-center gap-1.5">
              {/* clock icon */}
              <svg
                className="h-4 w-4 text-indigo-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M12 8v4l3 3" />
                <circle cx="12" cy="12" r="9" />
              </svg>
              {duration ?? "Duration TBD"}
            </span>
          </div>

          {/* Mentors */}
          <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
            {/* Primary mentor */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-full overflow-hidden ring-2 ring-white bg-slate-200 flex-shrink-0">
                {primary?.avatar ? (
                  <Image
                    src={primary.avatar}
                    alt={primary.name || "Mentor"}
                    width={40}
                    height={40}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-sm font-medium text-slate-700 bg-indigo-50">
                    {primary?.name?.slice(0, 1).toUpperCase() ?? "?"}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-slate-900">
                  {primary?.name ?? "Multiple mentors"}
                </div>
                <div className="truncate text-xs text-slate-600">
                  {primary?.role ?? (mentors && mentors.length > 1 ? "Lead Instructor" : "Instructor")}
                </div>
              </div>
            </div>

            {/* Extra avatars */}
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {extras.slice(0, 2).map((m, i) => (
                  <div
                    key={m.id ?? `${m.name}-${i}`}
                    className="h-8 w-8 rounded-full overflow-hidden ring-2 ring-white bg-slate-200"
                    aria-hidden
                  >
                    {m.avatar ? (
                      <Image
                        src={m.avatar}
                        alt={m.name || "Co-mentor"}
                        width={32}
                        height={32}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-[11px] font-medium text-slate-700">
                        {m.name?.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {extraCount > 1 && (
                <div className="ml-1 inline-flex h-8 min-w-[2rem] items-center justify-center rounded-full bg-emerald-600 px-2 text-xs font-bold text-white ring-2 ring-white">
                  +{extraCount}
                </div>
              )}
            </div>
          </div>

          {/* CTA bar (mobile-friendly full-width) */}
          <div className="mt-4">
            <span className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700">
              View details
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
