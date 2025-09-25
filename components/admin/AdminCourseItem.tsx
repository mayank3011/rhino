// components/admin/AdminCourseItem.tsx
"use client";

import React, { useState } from "react";
import AdminCourseForm from "./AdminCourseForm";
import { mutate } from "swr";
import toast from "react-hot-toast";
import fetcher from "../../utils/fetcher";
import Image from "next/image";
import type { ICourse } from "../../types/course";

export default function AdminCourseItem({ course }: { course: ICourse }) {
  const [editing, setEditing] = useState(false);
  const key = "/api/admin/courses";


  function fmtDate(d: string | null | undefined) {
    if (!d) return "";
    try {
      return new Date(d).toLocaleString();
    } catch {
      return String(d);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this course? This cannot be undone.")) return;
    try {
      const current: ICourse[] = await fetcher(key);
      mutate(key, current.filter((c: ICourse) => c._id !== course._id), false);
      const res = await fetch(`/api/admin/courses/${encodeURIComponent(course._id)}`, { method: "DELETE" });
      const j = await res.json().catch(() => ({} as Record<string, unknown>));
      if (!res.ok) {
        const errMsg = typeof j?.error === "string" ? j.error : "Delete failed";
        throw new Error(errMsg);
      }
      toast.success("Course deleted");
      mutate(key);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Delete failed";
      toast.error(message);
      mutate(key);
    }
  }

  return (
    <div className="bg-white border p-4 rounded-lg shadow-md transition-all duration-300 hover:shadow-lg">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="w-24 h-24 flex-shrink-0 rounded overflow-hidden bg-slate-50 border self-start">
          {course.image ? (
            <Image
              src={course.image}
              alt={course.title}
              width={96}
              height={96}
              className="w-full h-full object-cover"
            />
          ) : course.mentor?.image ? (
            <Image
              src={course.mentor.image}
              alt={course.mentor?.name ?? "mentor"}
              width={96}
              height={96}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">No image</div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-col-reverse sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-xl font-bold text-gray-900 truncate">{course.title}</h4>
                {course.slug && (
                  <span className="text-xs text-indigo-600 font-mono truncate">/{course.slug}</span>
                )}
                {course.metaTitle || course.metaDescription ? (
                  <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full text-yellow-800 bg-yellow-100">
                    SEO
                  </span>
                ) : null}
              </div>

              <div className="text-sm text-slate-500 mt-1 truncate">
                {course.niche ?? "—"}{course.categoryName ? ` • ${course.categoryName}` : ""}
              </div>
            </div>

            <div className="flex flex-col items-start sm:items-end gap-2 flex-shrink-0">
              <div className="font-bold text-xl text-gray-900">
                {course.price ? `₹${Number(course.price).toLocaleString()}` : <span className="text-slate-500 text-lg">Free</span>}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing((s) => !s)}
                  className="px-3 py-1 border border-indigo-600 text-indigo-600 rounded text-sm hover:bg-indigo-600 hover:text-white transition-colors"
                >
                  {editing ? "Close" : "Edit"}
                </button>
                <button
                  onClick={handleDelete}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>

          {course.description && (
            <div className="text-sm mt-2 text-slate-700 line-clamp-2">{course.description}</div>
          )}

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-600">
            {course.duration && <div>Duration: <span className="font-medium text-slate-800">{course.duration}</span></div>}
            {course.startTime && <div>Starts: <span className="font-medium text-slate-800">{fmtDate(course.startTime)}</span></div>}
            {course.mentor?.name && <div>Mentor: <span className="font-medium text-slate-800">{course.mentor.name}</span></div>}
          </div>

          {Array.isArray(course.keyOutcomes) && course.keyOutcomes.length > 0 && (
            <ul className="mt-3 list-disc list-inside text-sm text-slate-700 space-y-1 max-w-full sm:max-w-xl">
              {course.keyOutcomes.slice(0, 3).map((k: string, i: number) => <li key={i}>{k}</li>)}
            </ul>
          )}
        </div>
      </div>

      {editing && (
        <div className="mt-4 border-t border-slate-200 pt-4">
          <AdminCourseForm
            initialData={{ ...course, slug: course.slug ?? "" }}
            onSaved={() => {
              setEditing(false);
              toast.success("Saved");
              mutate(key);
            }}
          />
        </div>
      )}
    </div>
  );
}
