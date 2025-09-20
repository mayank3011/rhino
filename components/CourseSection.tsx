"use client";

import React from "react";
import CourseCard, { Course } from "./CourseCard";

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
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <a
            href="/explore"
            className="text-sm text-gray-700 hover:underline hidden sm:inline"
          >
            See all
          </a>
        </div>

        <div className="relative">
          <div className="hidden lg:grid lg:grid-cols-6 lg:gap-6">
            {courses.map((c) => (
              <CourseCard key={String(c._id ?? c.slug ?? c.title)} course={c} />
            ))}
          </div>

          <div className="lg:hidden overflow-x-auto -mx-4 px-4">
            <div className="flex gap-4">
              {courses.map((c) => (
                <CourseCard key={String(c._id ?? c.slug ?? c.title)} course={c} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
