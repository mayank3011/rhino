// app/course/create/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import AdminCourseForm from "@/components/admin/AdminCourseForm";

type AuthPayload = { role: string; userId: string; email: string };

export const revalidate = 0;

export default async function CreateCoursePage() {
  // Check cookie for token
  const token = (await cookies()).get(process.env.COOKIE_NAME || "token")?.value;
  if (!token) redirect("/login");

  let payload: AuthPayload | null = null;
  try {
    payload = verifyToken(token) as AuthPayload;
  } catch {
    redirect("/login");
  }

  // Only allow admins
  if (!payload || payload.role !== "admin") {
    redirect("/login");
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Create Course</h1>
      <div className="bg-white rounded-2xl border p-6 shadow-sm">
        <AdminCourseForm />
      </div>
    </div>
  );
}
