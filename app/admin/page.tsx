// app/admin/page.tsx
import { cookies } from "next/headers";
import { verifyToken } from "../../lib/auth";
import { redirect } from "next/navigation";
import connect from "../../lib/mongodb";
import Registration from "../../models/Registration";
import Course from "../../models/Course";
import Link from "next/link";
import { serializeArray } from "../../utils/serialize";
import AdminCoursesManager from "../../components/admin/AdminCoursesManager";

// Types
interface AuthPayload {
  role: string;
  userId: string;
  email: string;
}

interface SerializedRegistration {
  _id: string;
  name: string;
  email: string;
  createdAt?: string;
  course?: {
    title: string;
  };
}

interface SerializedCourse {
  _id: string;
  title: string;
  niche?: string;
  price?: number;
  duration?: string;
  createdAt?: string;
}

export const revalidate = 0;

export default async function AdminPage() {
  const token = (await cookies()).get(process.env.COOKIE_NAME || "token")?.value;
  if (!token) redirect("/login");

  let payload: AuthPayload;
  try { 
    payload = verifyToken(token) as AuthPayload; 
  } catch { 
    redirect("/login"); 
  }
  if (payload.role !== "admin") redirect("/login");

  await connect();

  const [regsRaw, coursesRaw, totalCourses, totalRegs] = await Promise.all([
    Registration.find().limit(200).populate("course").sort({ createdAt: -1 }).lean(),
    Course.find().sort({ createdAt: -1 }).limit(200).lean(),
    Course.countDocuments({}),
    Registration.countDocuments({}),
  ]);

 const regs = serializeArray<SerializedRegistration>(regsRaw);
const courses = serializeArray<SerializedCourse>(coursesRaw);
  // Remove unused variable warning by using courses data
  console.log(`Loaded ${courses.length} courses for admin dashboard`);

  return (
    <div className="container mx-auto px-6 py-10">
      <div className="flex items-start justify-between mb-8 gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">Overview — registrations, courses and quick actions.</p>
          <div className="mt-4 flex gap-4">
            <div className="rounded-lg bg-white border border-gray-200 p-3">
              <div className="text-xs text-gray-500">Total courses</div>
              <div className="text-xl font-semibold text-gray-900">{totalCourses}</div>
            </div>
            <div className="rounded-lg bg-white border border-gray-200 p-3">
              <div className="text-xs text-gray-500">Registrations</div>
              <div className="text-xl font-semibold text-gray-900">{totalRegs}</div>
            </div>
            <Link href="/course/create" className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md bg-indigo-600 text-white shadow hover:bg-indigo-700 transition">+ Create Course</Link>
            <Link href="/admin/courses" className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md border bg-white text-gray-700">Manage Courses</Link>
          </div>
        </div>
      </div>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Registrations</h2>
        <div className="overflow-x-auto rounded-lg border border-gray-300 shadow-sm bg-white">
          <table className="min-w-full text-left text-sm text-gray-800">
            <thead className="bg-gray-100 border-b border-gray-300">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Course</th>
                <th className="px-4 py-3 font-medium">Registered</th>
              </tr>
            </thead>
            <tbody>
              {regs.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-6 text-sm text-slate-600">No registrations yet.</td></tr>
              ) : regs.map((r) => (
                <tr key={r._id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3">{r.name}</td>
                  <td className="px-4 py-3">{r.email}</td>
                  <td className="px-4 py-3">{r.course?.title || "—"}</td>
                  <td className="px-4 py-3">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Courses</h2>
        </div>

        <div className="rounded-2xl bg-white border p-6">
          <AdminCoursesManager />
        </div>
      </section>
    </div>
  );
}