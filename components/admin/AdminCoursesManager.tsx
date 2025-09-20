// components/admin/AdminCoursesManager.tsx
"use client";
import useSWR from "swr";
import fetcher from "../../utils/fetcher";
import AdminCourseForm from "./AdminCourseForm";
import AdminCourseItem from "./AdminCourseItem";

export default function AdminCoursesManager() {
  const { data, error, isLoading } = useSWR("/api/admin/courses", fetcher, { revalidateOnFocus: false });

  if (error) return <div className="text-red-600">Failed to load</div>;
  if (isLoading) return <div>Loading...</div>;

  const courses = data ?? [];
  return (
    <div>
      <div className="mb-6"><h2 className="text-lg font-semibold">Create new course</h2><AdminCourseForm /></div>
      <div className="space-y-4">{courses.map((c:any) => <AdminCourseItem key={c._id} course={c} />)}</div>
    </div>
  );
}
