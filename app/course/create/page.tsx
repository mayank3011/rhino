// app/course/create/page.tsx
import AdminCourseForm from "@/components/admin/AdminCourseForm";

export default function Page() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Create Course</h1>
      <AdminCourseForm />
    </div>
  );
}
