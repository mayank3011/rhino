import { cookies } from "next/headers";
import { verifyToken } from "../../lib/auth";
import { redirect } from "next/navigation";
import connect from "../../lib/mongodb";
import Registration from "../../models/Registration";
import Course from "../../models/Course";
import Link from "next/link";

export default async function AdminPage() {
  const token = cookies().get(process.env.COOKIE_NAME || "token")?.value;
  if (!token) redirect("/login");

  let payload: any;
  try {
    payload = verifyToken(token);
  } catch (err) {
    redirect("/login");
  }
  if (payload.role !== "admin") redirect("/login");

  await connect();
  const regs = await Registration.find().limit(200).populate("course").lean();
  const courses = await Course.find().lean();

  return (
    <div className="container mx-auto px-6 py-10">
      {/* Header */}
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
        Admin Dashboard
      </h1>

      {/* Registrations */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Recent Registrations
        </h2>

        <div className="overflow-x-auto rounded-lg border border-gray-300 shadow-sm bg-white">
          <table className="min-w-full text-left text-sm text-gray-800">
            <thead className="bg-gray-100 border-b border-gray-300">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Course</th>
              </tr>
            </thead>
            <tbody>
              {regs.map((r: any) => (
                <tr
                  key={String(r._id)}
                  className="border-b border-gray-200 hover:bg-gray-50"
                >
                  <td className="px-4 py-3">{r.name}</td>
                  <td className="px-4 py-3">{r.email}</td>
                  <td className="px-4 py-3">{r.course?.title || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Courses */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Courses</h2>
          <Link
            href="/admin/courses"
            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md bg-indigo-600 text-white shadow hover:bg-indigo-700 transition"
          >
            + Create Course
          </Link>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-300 shadow-sm bg-white">
          <table className="min-w-full text-left text-sm text-gray-800">
            <thead className="bg-gray-100 border-b border-gray-300">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Niche</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c: any) => (
                <tr
                  key={String(c._id)}
                  className="border-b border-gray-200 hover:bg-gray-50"
                >
                  <td className="px-4 py-3">{c.title}</td>
                  <td className="px-4 py-3">{c.niche || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
