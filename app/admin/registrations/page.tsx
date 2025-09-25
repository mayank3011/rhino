// app/admin/registrations/page.tsx
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminRegistrationsManager from "@/components/admin/AdminRegistrationsManager";

// Types
interface AuthPayload {
  role: string;
  userId: string;
  email: string;
}

export default async function AdminRegistrationsPage() {
  const token = (await cookies()).get(process.env.COOKIE_NAME || "token")?.value;
  if (!token) redirect("/login");

  let payload: AuthPayload;
  try {
    payload = verifyToken(token) as AuthPayload;
    if (payload.role !== "admin") redirect("/login");
  } catch {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-first container with responsive padding */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        
        {/* Header section - responsive layout */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <div className="flex flex-col space-y-2 sm:space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
                  Admin • Registrations
                </h1>
                <p className="mt-1 text-xs sm:text-sm text-gray-600 max-w-2xl">
                  Verify payments, inspect screenshots, and confirm registrations.
                </p>
              </div>
              
              {/* Quick stats - responsive grid */}
              <div className="flex gap-2 sm:gap-3 mt-2 sm:mt-0">
                <div className="flex-1 sm:flex-none bg-white rounded-lg border border-gray-200 px-3 py-2 text-center min-w-0">
                  <div className="text-xs text-gray-500 truncate">Pending</div>
                  <div className="text-sm sm:text-base font-semibold text-orange-600">—</div>
                </div>
                <div className="flex-1 sm:flex-none bg-white rounded-lg border border-gray-200 px-3 py-2 text-center min-w-0">
                  <div className="text-xs text-gray-500 truncate">Verified</div>
                  <div className="text-sm sm:text-base font-semibold text-green-600">—</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content area - responsive card */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Card header - responsive padding */}
          <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 border-b border-gray-200 bg-gray-50/50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h2 className="text-base sm:text-lg font-medium text-gray-900">
                Registration Management
              </h2>
              
              {/* Action buttons - responsive layout */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button className="inline-flex items-center justify-center px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
                  Export Data
                </button>
                <button className="inline-flex items-center justify-center px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md bg-green-50 text-green-700 hover:bg-green-100 transition-colors">
                  Bulk Verify
                </button>
              </div>
            </div>
          </div>

          {/* Content area - responsive padding */}
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <AdminRegistrationsManager />
          </div>
        </div>

        {/* Footer info - responsive layout */}
        <div className="mt-4 sm:mt-6 lg:mt-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-blue-900">Quick Actions</h3>
                <p className="mt-1 text-xs text-blue-700">
                  Click on any registration to view details, verify payments, or update status.
                </p>
              </div>
              
              {/* Responsive navigation links */}
              <div className="flex flex-wrap gap-2 sm:gap-3 text-xs">
                <a href="/admin" className="text-blue-700 hover:text-blue-900 underline">
                  Dashboard
                </a>
                <a href="/admin/courses" className="text-blue-700 hover:text-blue-900 underline">
                  Courses
                </a>
                <a href="/admin/settings" className="text-blue-700 hover:text-blue-900 underline hidden sm:inline">
                  Settings
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}