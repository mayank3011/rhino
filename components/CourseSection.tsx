"use client";

import React from "react";
import Link from "next/link";
import CourseCard, { Course } from "./CourseCard";

// --- Constants based on Logo Colors ---
const COLOR_ACCENT = "emerald-600";

export default function CourseSection({
  title = "Workshops",
  courses = [] as Course[],
}: {
  title?: string;
  courses?: Course[];
}) {
  return (
    <section className="py-10">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex items-baseline justify-between mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">{title}</h2>
          <Link
            href="/explore"
            className={`text-base text-${COLOR_ACCENT} font-medium hover:underline transition-colors hidden sm:inline-block`}
          >
            See all →
          </Link>
        </div>

        {/* Course Carousel (scrollable on small screens) */}
        <div className="relative">
          <div className="hidden lg:grid lg:grid-cols-4 xl:grid-cols-6 gap-8">
            {courses.map((c) => (
              <CourseCard key={String(c._id ?? c.slug ?? c.title)} course={c} />
            ))}
          </div>

          {/* Mobile/Tablet Horizontal Scroll */}
          <div className="lg:hidden -mx-4 px-4 overflow-x-auto no-scrollbar">
            <div className="flex gap-4">
              {courses.map((c) => (
                <CourseCard key={String(c._id ?? c.slug ?? c.title)} course={c} />
              ))}
            </div>
          </div>
        </div>

        {/* Mobile "See all" button */}
        <div className="mt-8 text-center lg:hidden">
          <Link
            href="/explore"
            className={`inline-block px-6 py-3 border border-${COLOR_ACCENT} text-${COLOR_ACCENT} font-medium rounded-lg hover:bg-${COLOR_ACCENT} hover:text-white transition-colors`}
          >
            See all {title.toLowerCase()} →
          </Link>
        </div>
      </div>
    </section>
  );
}