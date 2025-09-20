// components/admin/AdminCourseItem.tsx
"use client";
import React, { useState } from "react";
import AdminCourseForm from "./AdminCourseForm";
import { mutate } from "swr";
import toast from "react-hot-toast";
import fetcher from "../../utils/fetcher";

export default function AdminCourseItem({ course }: { course: any }) {
  const [editing, setEditing] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this course? This cannot be undone.")) return;
    const key = "/api/admin/courses";
    const current = await fetcher(key);
    mutate(key, current.filter((c:any) => c._id !== course._id), false);
    try {
      const res = await fetch(`/api/admin/courses/${course._id}`, { method: "DELETE" });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Delete failed");
      toast.success("Deleted");
      mutate(key);
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
      mutate(key);
    }
  }

  return (
    <div className="bg-white border p-3 rounded">
      <div className="flex justify-between items-start gap-3">
        <div>
          <div className="font-semibold">{course.title}</div>
          <div className="text-sm text-slate-500">{course.niche} · {course.category}</div>
          <div className="text-sm mt-2">{course.description?.slice(0, 160)}</div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="font-medium">₹{course.price}</div>
          <div className="flex gap-2">
            <button onClick={() => setEditing(s => !s)} className="px-3 py-1 border rounded text-sm">{editing ? "Close" : "Edit"}</button>
            <button onClick={handleDelete} className="px-3 py-1 bg-red-500 text-white rounded text-sm">Delete</button>
          </div>
        </div>
      </div>

      {editing && <div className="mt-3"><AdminCourseForm initialData={course} onSaved={() => setEditing(false)} /></div>}
    </div>
  );
}
