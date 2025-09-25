// app/admin/registrations/page.tsx
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminRegistrationsManager from "@/components/admin/AdminRegistrationsManager";

export default async function AdminRegistrationsPage() {
  const token = cookies().get(process.env.COOKIE_NAME || "token")?.value;
  if (!token) redirect("/login");

  let payload: any;
  try {
    payload = verifyToken(token);
    if (payload.role !== "admin") redirect("/login");
  } catch {
    redirect("/login");
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin • Registrations</h1>
          <p className="text-sm text-slate-600">Verify payments, inspect screenshots, and confirm registrations.</p>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow">
        <AdminRegistrationsManager />
      </div>
    </div>
  );
}
