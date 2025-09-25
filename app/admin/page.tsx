// app/admin/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

import connect from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import Registration from "@/models/Registration";
import Course from "@/models/Course";

import AdminCoursesManager from "@/components/admin/AdminCoursesManager"; // client, self-fetching
import QuickStatsChart from "@/components/admin/QuickStatsChart";          // client, self-fetching
import RegistrationsTable from "@/components/admin/RegistrationsTable";    // client, self-fetching

import { toPlain } from "@/utils/serialize";

// ---- Types for server-rendered table row ----
interface RegCourseLite {
  title?: string;
}

interface RegRow {
  _id: string;
  name: string;
  email: string;
  createdAt?: string;      // ISO string
  amount?: number;
  status?: "awaiting_verification" | "pending" | "verified" | "rejected";
  course?: RegCourseLite | null;
}

export const revalidate = 0;

export default async function AdminPage() {
  const token = (await cookies()).get(process.env.COOKIE_NAME || "token")?.value;
  if (!token) redirect("/login");

  let payload: { role: string; userId: string; email: string };
  try {
    payload = verifyToken(token) as { role: string; userId: string; email: string };
  } catch {
    redirect("/login");
  }
  if (payload.role !== "admin") redirect("/login");

  await connect();

  // Load small server-side overview ONLY (counts + latest rows)
  const [regsRaw, totalCourses, totalRegs] = await Promise.all([
    Registration.find().limit(8).populate("course").sort({ createdAt: -1 }).lean(),
    Course.countDocuments({}),
    Registration.countDocuments({}),
  ]);

  // Serialize for safe server rendering
  const regs: RegRow[] = (toPlain(regsRaw) as unknown as RegRow[]).map((r) => ({
    _id: r._id,
    name: r.name,
    email: r.email,
    createdAt: r.createdAt,
    amount: r.amount,
    status: r.status,
    course: r.course ? { title: r.course.title } : null,
  }));

  return (
    <div className="container mx-auto px-6 py-10">
      {/* Header / KPIs */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Overview — registrations, courses and quick actions.
          </p>
          <div className="mt-4 flex flex-wrap gap-4">
            <div className="rounded-lg bg-white border border-gray-200 p-3 min-w-[10rem]">
              <div className="text-xs text-gray-500">Total courses</div>
              <div className="text-xl font-semibold text-gray-900">{totalCourses}</div>
            </div>
            <div className="rounded-lg bg-white border border-gray-200 p-3 min-w-[10rem]">
              <div className="text-xs text-gray-500">Registrations</div>
              <div className="text-xl font-semibold text-gray-900">{totalRegs}</div>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-3">
          <Link
            href="/course/create"
            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md bg-indigo-600 text-white shadow hover:bg-indigo-700 transition"
          >
            + Create Course
          </Link>
          <Link
            href="/admin/courses"
            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md border bg-white text-gray-700"
          >
            Manage Courses
          </Link>
          <Link
            href="/admin/registrations"
            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md border bg-white text-gray-700"
          >
            Verify Payments
          </Link>
        </div>
      </div>

      {/* Row: Stats + Recent server table */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-10">
        {/* Stats sparkline (client, self-fetches) */}
        <div className="xl:col-span-1">
          <QuickStatsChart days={30} />
        </div>

        {/* Recent registrations (server-rendered, already serialized) */}
        <div className="xl:col-span-2">
          <section className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">Recent Registrations</h2>
              <Link
                href="/admin/registrations"
                className="text-sm text-indigo-700 hover:underline"
              >
                View all →
              </Link>
            </div>
            <div className="overflow-x-auto rounded border">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 font-medium text-slate-700">Name</th>
                    <th className="px-4 py-3 font-medium text-slate-700">Email</th>
                    <th className="px-4 py-3 font-medium text-slate-700">Course</th>
                    <th className="px-4 py-3 font-medium text-slate-700">Amount</th>
                    <th className="px-4 py-3 font-medium text-slate-700">Status</th>
                    <th className="px-4 py-3 font-medium text-slate-700">Registered</th>
                  </tr>
                </thead>
                <tbody>
                  {regs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-slate-600">
                        No registrations yet.
                      </td>
                    </tr>
                  ) : (
                    regs.map((r) => (
                      <tr key={r._id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3">{r.name}</td>
                        <td className="px-4 py-3">{r.email}</td>
                        <td className="px-4 py-3">{r.course?.title ?? "—"}</td>
                        <td className="px-4 py-3">
                          {typeof r.amount === "number"
                            ? `₹${r.amount.toLocaleString("en-IN")}`
                            : "—"}
                        </td>
                        <td className="px-4 py-3">
                          {r.status ? (
                            <span
                              className={
                                r.status === "verified"
                                  ? "inline-block px-2 py-0.5 rounded bg-green-50 text-green-700"
                                  : r.status === "rejected"
                                  ? "inline-block px-2 py-0.5 rounded bg-rose-50 text-rose-700"
                                  : r.status === "awaiting_verification"
                                  ? "inline-block px-2 py-0.5 rounded bg-yellow-50 text-yellow-700"
                                  : "inline-block px-2 py-0.5 rounded bg-slate-50 text-slate-700"
                              }
                            >
                              {r.status}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {r.createdAt ? new Date(r.createdAt).toLocaleString() : ""}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>

      {/* Courses manager (client, self-fetches — no props) */}
      <section className="rounded-2xl bg-white border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Courses</h2>
        </div>
        <AdminCoursesManager />
      </section>

      {/* Full registrations list (client, self-fetches — no props) */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">All Registrations</h2>
        <RegistrationsTable />
      </section>
    </div>
  );
}
