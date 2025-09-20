"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminHeaderActions({
  initialQuery = "",
}: {
  initialQuery?: string;
}) {
  const [q, setQ] = useState(initialQuery);
  const router = useRouter();

  function onSearch(e?: React.FormEvent) {
    if (e) e.preventDefault();
    // For now navigate to /admin/courses?q=... (AdminCoursesManager can read query on mount)
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    router.push(`/admin/courses?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-3">
      <div className="hidden sm:flex items-center bg-white border border-gray-300 rounded-md px-2 py-1">
        <form onSubmit={onSearch} className="flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            type="search"
            aria-label="Search courses"
            placeholder="Search courses..."
            className="w-56 text-sm placeholder:text-slate-400 outline-none px-2 py-1"
          />
          <button
            type="submit"
            className="px-2 py-1 text-sm text-slate-600 hover:text-slate-800"
          >
            Search
          </button>
        </form>
      </div>

      <Link
        href="/admin/courses/create"
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-indigo-600 text-white shadow hover:bg-indigo-700 transition"
      >
        + Create Course
      </Link>
    </div>
  );
}
