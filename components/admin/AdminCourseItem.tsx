// components/admin/AdminCourseItem.tsx
"use client";
import React, { useState } from "react";
import AdminCourseForm from "./AdminCourseForm";
import { mutate } from "swr";
import toast from "react-hot-toast";
import fetcher from "../../utils/fetcher";

export default function AdminCourseItem({ course }: { course: any }) {
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
    // optimistic removal
    try {
      const current = await fetcher(key);
      mutate(key, current.filter((c: any) => c._id !== course._id), false);
      const res = await fetch(`/api/admin/courses/${course._id}`, { method: "DELETE" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "Delete failed");
      toast.success("Course deleted");
      mutate(key);
    } catch (err: any) {
      toast.error(err?.message || "Delete failed");
      mutate(key); // refetch to restore
    }
  }

  return (
    <div className="bg-white border p-4 rounded-lg shadow-sm">
      <div className="flex gap-4">
        <div className="w-24 h-24 flex-shrink-0 rounded overflow-hidden bg-slate-50 border">
          {course.image ? (
            <img src={course.image} alt={course.title} className="w-full h-full object-cover" />
          ) : course.mentor?.image ? (
            <img src={course.mentor.image} alt={course.mentor?.name || "mentor"} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">No image</div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-gray-900 truncate">{course.title}</h4>
                {course.slug ? (
                  <span className="text-xs text-indigo-600 font-mono truncate">/{course.slug}</span>
                ) : null}

                {course.metaTitle || course.metaDescription ? (
                  <span className="ml-2 inline-flex items-center text-xs px-2 py-0.5 rounded text-yellow-800 bg-yellow-50">
                    SEO
                  </span>
                ) : null}
              </div>

              <div className="text-xs text-slate-500 mt-1 truncate">
                {course.niche ?? "—"}{course.categoryName ? ` • ${course.categoryName}` : ""}
              </div>

              {course.description ? (
                <div className="text-sm mt-2 text-slate-700 line-clamp-2">{course.description}</div>
              ) : null}

              {/* small meta row */}
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-600">
                {course.duration ? <div>Duration: <span className="font-medium text-slate-800">{course.duration}</span></div> : null}
                {course.startTime ? <div>Starts: <span className="font-medium text-slate-800">{fmtDate(course.startTime)}</span></div> : null}
                {course.mentor?.name ? <div>Mentor: <span className="font-medium text-slate-800">{course.mentor.name}</span></div> : null}
              </div>

              {/* key outcomes (up to 3) */}
              {Array.isArray(course.keyOutcomes) && course.keyOutcomes.length > 0 ? (
                <ul className="mt-3 list-disc list-inside text-sm text-slate-700 space-y-1 max-w-xl">
                  {course.keyOutcomes.slice(0, 3).map((k: string, i: number) => <li key={i}>{k}</li>)}
                </ul>
              ) : null}
            </div>

            <div className="flex flex-col items-end gap-3">
              <div className="font-medium text-gray-900">{course.price ? `₹${Number(course.price).toLocaleString()}` : <span className="text-slate-500">Free</span>}</div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing((s) => !s)}
                  className="px-3 py-1 border rounded text-sm hover:bg-slate-50"
                >
                  {editing ? "Close" : "Edit"}
                </button>
                <button
                  onClick={handleDelete}
                  className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {editing && (
        <div className="mt-4">
          <AdminCourseForm
            initialData={course}
            onSaved={(d?: any) => {
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
