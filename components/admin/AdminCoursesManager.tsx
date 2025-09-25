// components/admin/AdminCoursesManager.tsx
"use client";
import React from "react";
import useSWR from "swr";
import fetcher from "../../utils/fetcher";
import AdminCourseItem from "./AdminCourseItem";
import Link from "next/link";

export default function AdminCoursesManager() {
  const { data, error, isLoading, mutate } = useSWR("/api/admin/courses", fetcher, { revalidateOnFocus: false });
  const courses: any[] = data || [];

  React.useEffect(() => { if (!isLoading && !error) console.log("AdminCoursesManager data sample", courses[0]); }, [isLoading, error, courses]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-md font-semibold">All courses</h4>
        <div className="flex items-center gap-2">
          <Link href="/course/create" className="px-3 py-1 rounded border bg-indigo-600 text-white text-sm">+ Create Course</Link>
          <button onClick={() => mutate()} className="px-3 py-1 rounded border text-sm">Refresh</button>
        </div>
      </div>

      <div>
        {isLoading ? (
          <div className="text-sm text-slate-600">Loading courses...</div>
        ) : error ? (
          <div className="text-sm text-red-600">Failed to load courses</div>
        ) : courses.length === 0 ? (
          <div className="text-sm text-slate-600">No courses yet. Create one to get started.</div>
        ) : (
          <div className="grid gap-3">
            {courses.map(c => <AdminCourseItem key={c._id} course={c} />)}
          </div>
        )}
      </div>
    </div>
  );
}
