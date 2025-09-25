"use client";

import React, { useMemo, useState } from "react";
import useSWR from "swr";

// ---- Types ----
export type RegistrationStatus =
  | ""
  | "awaiting_verification"
  | "pending"
  | "verified"
  | "rejected";

export interface RegCourseLite {
  title: string;
}

export interface RegItem {
  _id: string;
  name: string;
  email: string;
  createdAt?: string; // ISO
  course?: RegCourseLite | null;
  amount?: number;
  status?: RegistrationStatus;
}

interface ListResponse {
  registrations: RegItem[];
  total: number;
}

async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

function buildQS(input: Record<string, string | number | undefined>): string {
  const parts: string[] = [];
  Object.entries(input).forEach(([k, v]) => {
    if (v === undefined) return;
    const sv = String(v);
    if (sv.length === 0) return;
    parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(sv)}`);
  });
  return parts.join("&");
}

export default function RegistrationsTable() {
  // UI state
  const [status, setStatus] = useState<RegistrationStatus>(""); // all by default
  const [q, setQ] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);

  const key = useMemo(() => {
    const qs = buildQS({ status, q, page, limit });
    return `/api/admin/registrations?${qs}`;
  }, [status, q, page, limit]);

  const { data, error, isLoading, mutate } = useSWR<ListResponse>(key, fetcher<ListResponse>, {
    revalidateOnFocus: false,
  });

  const regs = data?.registrations ?? [];
  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / limit));

  function goPrev(): void {
    setPage((p) => Math.max(1, p - 1));
  }
  function goNext(): void {
    setPage((p) => Math.min(pages, p + 1));
  }

  // Reset to first page when filters change
  React.useEffect(() => {
    setPage(1);
  }, [status, q, limit]);

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-600">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as RegistrationStatus)}
            className="p-2 border rounded bg-white"
          >
            <option value="">All</option>
            <option value="awaiting_verification">Awaiting verification</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>

          <label className="text-sm text-slate-600 ml-3">Per page</label>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="p-2 border rounded bg-white"
          >
            <option value={6}>6</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={40}>40</option>
          </select>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name / email / txn"
            className="p-2 border rounded w-full sm:w-64"
          />
          <button
            onClick={() => mutate()}
            className="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Search
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded">
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
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-slate-500">
                  Loading…
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-rose-600">
                  Failed to load registrations
                </td>
              </tr>
            ) : regs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-slate-500">
                  No registrations found.
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

      {/* Pagination */}
      <div className="mt-3 flex items-center justify-between">
        <div className="text-sm text-slate-600">
          Total: <span className="font-medium">{total}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={page <= 1}
            onClick={goPrev}
            className="px-3 py-1.5 border rounded disabled:opacity-50"
          >
            Prev
          </button>
          <div className="px-3 py-1.5 border rounded text-sm">
            {page} / {pages}
          </div>
          <button
            disabled={page >= pages}
            onClick={goNext}
            className="px-3 py-1.5 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
