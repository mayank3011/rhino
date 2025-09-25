// app/admin/courses/page.tsx
import { cookies } from "next/headers";
import { verifyToken } from "../../../lib/auth";
import { redirect } from "next/navigation";
import AdminCoursesManager from "../../../components/admin/AdminCoursesManager";
import AdminPromoManager from "../../../components/admin/AdminPromoManager";
import AdminHeaderActions from "../../../components/admin/AdminHeaderActions";
import Link from "next/link";
import connect from "../../../lib/mongodb";
import Registration from "../../../models/Registration";
import Course from "../../../models/Course";
import { serializeArray } from "../../../utils/serialize";

export const revalidate = 0; // admin pages should be fresh (optional)

export default async function AdminPage() {
  const token = (await cookies()).get(process.env.COOKIE_NAME || "token")?.value;
  if (!token) redirect("/login");

  let payload: any;
  try {
    payload = verifyToken(token);
    if (payload.role !== "admin") redirect("/login");
  } catch {
    redirect("/login");
  }

  // connect and fetch minimal server-side data (limited & lean)
  await connect();

  // get simple counts for stats
  const [totalCourses, totalRegs] = await Promise.all([
    Course.countDocuments({}),
    Registration.countDocuments({}),
  ]);

  // fetch small previews for recent items (lean + serialized)
  const [recentRegsRaw, recentCoursesRaw] = await Promise.all([
    // populate only needed fields from course (title)
    Registration.find().sort({ createdAt: -1 }).limit(8).populate("course", "title").lean(),
    Course.find().sort({ createdAt: -1 }).limit(8).lean(),
  ]);

  const recentRegs = serializeArray(recentRegsRaw);
  const recentCourses = serializeArray(recentCoursesRaw);

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Admin • Courses</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage courses, create new ones, and maintain promo codes.
          </p>
        </div>

        {/* Client-side interactive actions */}
        <AdminHeaderActions />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-lg bg-white border border-gray-300 p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500">Total Courses</div>
            <div className="text-xl font-semibold text-gray-900">{totalCourses}</div>
          </div>
          <div className="text-gray-400">📚</div>
        </div>

        <div className="rounded-lg bg-white border border-gray-300 p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500">Recent Registrations</div>
            <div className="text-xl font-semibold text-gray-900">{totalRegs}</div>
          </div>
          <div className="text-gray-400">📝</div>
        </div>

        <div className="rounded-lg bg-white border border-gray-300 p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500">Promo Codes</div>
            <div className="text-xl font-semibold text-gray-900">Manage</div>
          </div>
          <div className="text-gray-400">🏷️</div>
        </div>
      </div>

      {/* Main layout: 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <main className="lg:col-span-2 space-y-6">
          {/* Courses manager card */}
          <div className="rounded-2xl bg-white border border-gray-300 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Courses</h2>
              <p className="text-xs text-gray-600 mt-1">Create, edit, publish and delete courses.</p>
            </div>

            <div className="p-6">
              <AdminCoursesManager />
            </div>
          </div>

          {/* Recent registrations preview (server-rendered) */}
          <div className="rounded-2xl bg-white border border-gray-300 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-md font-medium text-gray-900">Recent Registrations</h3>
            </div>

            <div className="p-4">
              <div className="grid gap-3">
                {recentRegs.length === 0 ? (
                  <div className="text-sm text-gray-600">No registrations yet.</div>
                ) : (
                  recentRegs.map((r: any) => (
                    <div key={String(r._id)} className="flex items-center justify-between border rounded-md p-3">
                      <div>
                        <div className="font-medium text-gray-900">{r.name}</div>
                        <div className="text-xs text-gray-700">{r.email}</div>
                        <div className="text-xs text-gray-500">{r.course?.title ?? "—"}</div>
                      </div>
                      <div className="text-xs text-gray-500">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ""}</div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-3">
                <Link href="/admin/registrations" className="text-sm text-indigo-600 hover:underline">
                  View all registrations
                </Link>
              </div>
            </div>
          </div>
        </main>

        {/* Right column */}
        <aside className="space-y-6">
          <div className="rounded-2xl bg-white border border-gray-300 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Promo Codes</h3>
              <Link href="/admin/promo/create" className="text-xs text-indigo-600 hover:underline">
                Add
              </Link>
            </div>

            <div className="mt-4">
              <AdminPromoManager />
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-gray-300 shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-900">Recent Courses</h3>

            <div className="mt-4 grid gap-3">
              {recentCourses.length === 0 ? (
                <div className="text-sm text-gray-600">No courses yet.</div>
              ) : (
                recentCourses.map((c: any) => (
                  <div key={String(c._id)} className="flex items-center justify-between border rounded-md p-3">
                    <div>
                      <div className="font-medium text-gray-900">{c.title}</div>
                      <div className="text-xs text-gray-700">{c.niche ?? "—"}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {c.price ? (
                          <span>₹{Number(c.price).toLocaleString()}</span>
                        ) : (
                          <span className="text-slate-500">Free</span>
                        )}
                        {c.duration ? <span className="mx-2">•</span> : null}
                        {c.duration ? <span className="text-xs">{c.duration}</span> : null}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {c.mentor?.name ? <span>Mentor: {c.mentor.name}</span> : null}
                        {c.startTime ? (
                          <>
                            <span className="mx-2">•</span>
                            <span>Starts: {new Date(c.startTime).toLocaleDateString()}</span>
                          </>
                        ) : null}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ""}</div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-3">
              <Link href="/admin/courses" className="text-sm text-indigo-600 hover:underline">
                Manage courses
              </Link>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-gray-300 shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-900">Helpful links</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>
                <Link href="/admin/settings" className="hover:underline">
                  Settings
                </Link>
              </li>
              <li>
                <Link href="/admin/users" className="hover:underline">
                  Manage users
                </Link>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
