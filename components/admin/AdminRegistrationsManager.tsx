// components/admin/AdminRegistrationsManager.tsx
"use client";

import React, { JSX, useEffect, useState } from "react";
import useSWR from "swr";
import fetcher from "@/utils/fetcher";
import toast from "react-hot-toast";
import Image from "next/image";

// Types for better type safety
interface PaymentProof {
  screenshot?: string;
  screenshots?: string[];
  txnId?: string;
  verificationNotes?: string;
  email?: {
    ok: boolean;
    error?: string;
    messageId?: string;
    lastEvent?: string;
  };
  createdRemoteUser?: {
    result?: {
      created?: boolean;
      passwordPlain?: string;
      error?: string;
    };
  };
}

interface IRegistration {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  course: string;
  amount?: number;
  createdAt: string;
  paymentProof?: PaymentProof;
}

interface QueryParams {
  status?: string;
  q?: string;
  page?: number;
  limit?: number;
}

interface RegistrationResponse {
  registrations: IRegistration[];
  total: number;
}

interface VerificationRequest {
  action: "verify" | "reject";
  verificationNotes: string;
  paid?: boolean;
}

interface VerificationResponse {
  success: boolean;
  message?: string;
  error?: string;
  email?: {
    ok: boolean;
    error?: string;
    resp?: Array<{
      headers?: Record<string, string>;
    }>;
  };
}

function qs(params: QueryParams): string {
  return Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== "")
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join("&");
}

export default function AdminRegistrationsManager(): JSX.Element {
  const [status, setStatus] = useState<string>("awaiting_verification");
  const [q, setQ] = useState<string>("");
  const [debouncedQ, setDebouncedQ] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(12);

  const [selected, setSelected] = useState<IRegistration | null>(null);
  const [notes, setNotes] = useState<string>("");
  const [processing, setProcessing] = useState<boolean>(false);
  const [markPaid, setMarkPaid] = useState<boolean>(true);

  // Debounce search input
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => clearTimeout(timeout);
  }, [q]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [status, debouncedQ, limit]);

  const key = `/api/admin/registrations?${qs({ status, q: debouncedQ, page, limit })}`;
  const { data, error, mutate } = useSWR<RegistrationResponse>(key, fetcher, { 
    revalidateOnFocus: false 
  });

  const regs = data?.registrations ?? [];
  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil((total || 0) / limit));

  function openDetails(registration: IRegistration): void {
    setSelected(registration);
    setNotes(registration.paymentProof?.verificationNotes ?? "");
    setMarkPaid(true);
  }

  function openUrl(url?: string): void {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function doAction(id: string, action: "verify" | "reject"): Promise<void> {
    if (!confirm(`Are you sure you want to ${action} this registration?`)) return;
    
    setProcessing(true);
    try {
      const body: VerificationRequest = { 
        action, 
        verificationNotes: notes 
      };
      if (action === "verify") body.paid = markPaid;

      const res = await fetch(`/api/admin/registrations/${id}/verify`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });

      const response: VerificationResponse = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = response?.message || response?.error || `Action failed (${res.status})`;
        toast.error(message);
        console.error("verify failed:", response);
        return;
      }

      toast.success(action === "verify" ? "Verified" : "Rejected");

      // Show email send info if present
      if (response?.email) {
        if (response.email.ok) {
          const messageId = response.email?.resp?.[0]?.headers?.["x-message-id"] ?? 
                           response.email?.resp?.[0]?.headers?.["x-message-id".toLowerCase()];
          toast.success(`Notification queued${messageId ? ` (id: ${String(messageId).slice(0, 12)})` : ""}`);
        } else if (response.email?.error) {
          toast.error(`Email: ${response.email.error}`);
        }
      }

      // Refresh list & clear modal
      await mutate();
      setSelected(null);
    } catch (error) {
      console.error("admin action error", error);
      const err = error as Error;
      toast.error(err?.message || "Action failed");
    } finally {
      setProcessing(false);
    }
  }

  if (error) return (
    <div className="text-red-600 p-4 bg-red-50 border border-red-200 rounded-lg">
      Failed to load registrations
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-100 p-2 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg border border-indigo-100 p-4 sm:p-6">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
            Registration Management
          </h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">
            Manage student registrations and payment verifications
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg border border-indigo-100 p-4 sm:p-6">
          <div className="flex flex-col space-y-4 lg:space-y-0 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
            {/* Left side filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
              <select 
                value={status} 
                onChange={(e) => setStatus(e.target.value)} 
                className="w-full sm:w-auto px-3 sm:px-4 py-2 border-2 border-indigo-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 text-sm sm:text-base"
              >
                <option value="">All Statuses</option>
                <option value="awaiting_verification">Awaiting Verification</option>
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
              </select>

              <select 
                value={limit} 
                onChange={(e) => setLimit(Number(e.target.value))} 
                className="w-full sm:w-auto px-3 sm:px-4 py-2 border-2 border-indigo-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 text-sm sm:text-base"
              >
                <option value={6}>6 per page</option>
                <option value={12}>12 per page</option>
                <option value={24}>24 per page</option>
              </select>
            </div>

            {/* Right side search and actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
              <input
                placeholder="Search name, email, or transaction ID..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="flex-1 sm:w-64 lg:w-80 px-3 sm:px-4 py-2 border-2 border-indigo-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 text-sm sm:text-base"
              />
              <button 
                onClick={() => mutate()} 
                className="px-4 sm:px-6 py-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white rounded-lg hover:from-indigo-700 hover:via-purple-700 hover:to-blue-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl text-sm sm:text-base whitespace-nowrap"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {regs.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg border border-indigo-100 p-6 sm:p-8 text-center">
            <div className="text-gray-400 text-4xl sm:text-6xl mb-4">📋</div>
            <p className="text-gray-600 text-base sm:text-lg">No registrations found.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4">
            {regs.map((registration) => (
              <div key={registration._id} className="bg-white rounded-xl shadow-lg border border-indigo-100 hover:shadow-xl transition-all duration-200">
                <div className="p-4 sm:p-6">
                  <div className="flex flex-col space-y-4 lg:space-y-0 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
                    {/* Registration Details */}
                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-base sm:text-lg text-gray-900 truncate">
                            {registration.name}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600 truncate">
                            {registration.email} • {registration.phone || "—"}
                          </p>
                          <p className="text-xs sm:text-sm mt-1">
                            Course: <span className="font-medium text-indigo-600">{registration.course}</span>
                          </p>
                        </div>
                        <div className="text-xs text-gray-500 whitespace-nowrap self-start">
                          {new Date(registration.createdAt).toLocaleString()}
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <div className="inline-flex items-center px-2 sm:px-3 py-1 bg-indigo-50 rounded-full">
                          <span className="text-xs sm:text-sm font-medium text-indigo-700">
                            Txn: {registration.paymentProof?.txnId || "—"}
                          </span>
                        </div>
                        <div className="inline-flex items-center px-2 sm:px-3 py-1 bg-green-50 rounded-full">
                          <span className="text-xs sm:text-sm font-medium text-green-700">
                            ₹{Number(registration.amount || 0).toLocaleString()}
                          </span>
                        </div>

                        {/* Email Status Badge */}
                        <div>
                          {registration.paymentProof?.email ? (
                            registration.paymentProof.email.ok ? (
                              <span className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                Email Sent ✓
                                {registration.paymentProof.email.messageId && (
                                  <span className="text-xs text-gray-600 hidden sm:inline">
                                    #{String(registration.paymentProof.email.messageId).slice(0, 10)}
                                  </span>
                                )}
                              </span>
                            ) : (
                              <span 
                                className="inline-flex items-center px-2 sm:px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium cursor-help" 
                                title={registration.paymentProof.email.error || "Send failed"}
                              >
                                Send Failed
                              </span>
                            )
                          ) : (
                            <span className="inline-flex items-center px-2 sm:px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                              Not Sent
                            </span>
                          )}
                        </div>

                        {/* Webhook Last Event */}
                        {registration.paymentProof?.email?.lastEvent && (
                          <div className="inline-flex items-center px-2 sm:px-3 py-1 bg-blue-50 rounded-full">
                            <span className="text-xs text-blue-700">
                              Event: <span className="font-medium">{registration.paymentProof.email.lastEvent}</span>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex sm:flex-col items-center gap-2 flex-shrink-0">
                      <button 
                        onClick={() => openDetails(registration)} 
                        className="flex-1 sm:flex-none px-3 sm:px-4 py-2 border-2 border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-200 font-medium whitespace-nowrap text-sm"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        <div className="bg-white rounded-xl shadow-lg border border-indigo-100 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600 order-2 sm:order-1">
              Total: <span className="font-medium text-indigo-600">{total}</span> registrations
            </div>
            <div className="flex items-center gap-2 order-1 sm:order-2">
              <button 
                disabled={page <= 1} 
                onClick={() => setPage((p) => Math.max(1, p - 1))} 
                className="px-3 sm:px-4 py-2 border-2 border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm"
              >
                Previous
              </button>
              <div className="px-3 sm:px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg font-medium text-sm">
                {page} / {pages}
              </div>
              <button 
                disabled={page >= pages} 
                onClick={() => setPage((p) => Math.min(pages, p + 1))} 
                className="px-3 sm:px-4 py-2 border-2 border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Modal */}
        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4">
            <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-auto shadow-2xl mx-2">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-indigo-100 p-4 sm:p-6 rounded-t-2xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900">{selected.name}</h3>
                    <div className="text-sm text-gray-600 mt-1">{selected.email} • {selected.phone}</div>
                    <div className="mt-2 text-sm">
                      Course: <span className="font-medium text-indigo-600">{selected.course}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="text-xs text-gray-500">
                      {new Date(selected.createdAt).toLocaleString()}
                    </div>
                    <button 
                      onClick={() => setSelected(null)} 
                      className="px-3 sm:px-4 py-2 border-2 border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 text-sm"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Screenshots Gallery */}
                <div>
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Payment Screenshots</h4>

                  {selected.paymentProof?.screenshots && Array.isArray(selected.paymentProof.screenshots) && selected.paymentProof.screenshots.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selected.paymentProof.screenshots.map((screenshot: string, index: number) => (
                        <button 
                          key={index} 
                          onClick={() => openUrl(screenshot)} 
                          className="border-2 border-indigo-200 rounded-xl overflow-hidden hover:border-indigo-400 transition-all duration-200 group"
                        >
                          <Image 
                            src={screenshot} 
                            alt={`Screenshot ${index + 1}`}
                            width={300}
                            height={200}
                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200" 
                          />
                        </button>
                      ))}
                    </div>
                  ) : selected.paymentProof?.screenshot ? (
                    <div>
                      <button 
                        onClick={() => openUrl(selected.paymentProof?.screenshot)} 
                        className="border-2 border-indigo-200 rounded-xl overflow-hidden hover:border-indigo-400 transition-all duration-200 group w-full"
                      >
                        <Image 
                          src={selected.paymentProof.screenshot} 
                          alt="Payment Screenshot"
                          width={400}
                          height={300}
                          className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-200" 
                        />
                      </button>
                    </div>
                  ) : (
                    <div className="p-6 sm:p-8 border-2 border-dashed border-gray-300 rounded-xl text-center text-gray-500">
                      <div className="text-3xl sm:text-4xl mb-2">📷</div>
                      <p className="text-sm sm:text-base">No screenshots available</p>
                    </div>
                  )}

                  <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl">
                    <div className="text-sm text-gray-700 space-y-2">
                      <div className="flex justify-between">
                        <span>Transaction ID:</span>
                        <span className="font-medium text-indigo-600">{selected.paymentProof?.txnId || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Amount:</span>
                        <span className="font-medium text-green-600">₹{Number(selected.amount || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Actions & Notes */}
                <div className="space-y-6">
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900">Verification Actions</h4>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Verification Notes
                    </label>
                    <textarea 
                      value={notes} 
                      onChange={(e) => setNotes(e.target.value)} 
                      rows={4} 
                      className="w-full border-2 border-indigo-200 rounded-lg p-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 text-sm" 
                      placeholder="Add verification notes..."
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        checked={markPaid} 
                        onChange={(e) => setMarkPaid(e.target.checked)} 
                        className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 border-2 border-indigo-200 rounded focus:ring-indigo-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Mark as paid when verifying
                      </span>
                    </label>
                  </div>

                  <div className="flex flex-col gap-3">
                    <button 
                      disabled={processing} 
                      onClick={() => doAction(selected._id, "verify")} 
                      className="px-4 sm:px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl text-sm sm:text-base"
                    >
                      {processing ? "Processing..." : "✓ Verify & Mark Paid"}
                    </button>
                    <button 
                      disabled={processing} 
                      onClick={() => doAction(selected._id, "reject")} 
                      className="px-4 sm:px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl text-sm sm:text-base"
                    >
                      {processing ? "Processing..." : "✗ Reject"}
                    </button>
                  </div>

                  {/* Email Notification Status */}
                  {selected.paymentProof?.email && (
                    <div className="p-4 border border-indigo-200 rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50">
                      <h5 className="font-semibold text-indigo-800 mb-3 text-sm sm:text-base">Email Notification Status</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Status:</span>
                          <span className={`font-medium ${selected.paymentProof.email.ok ? 'text-green-600' : 'text-red-600'}`}>
                            {selected.paymentProof.email.ok ? 'Sent Successfully' : 'Failed to Send'}
                          </span>
                        </div>
                        {selected.paymentProof.email.messageId && (
                          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                            <span>Message ID:</span>
                            <code className="text-xs bg-white px-2 py-1 rounded border break-all">
                              {selected.paymentProof.email.messageId}
                            </code>
                          </div>
                        )}
                        {selected.paymentProof.email.error && (
                          <div className="text-red-600 mt-2 p-2 bg-red-50 rounded border border-red-200">
                            <strong>Error:</strong> {selected.paymentProof.email.error}
                          </div>
                        )}
                        {selected.paymentProof.email.lastEvent && (
                          <div className="flex justify-between">
                            <span>Last Event:</span>
                            <span className="font-medium text-blue-600">{selected.paymentProof.email.lastEvent}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Student Account Status */}
                  {selected.paymentProof?.createdRemoteUser && (
                    <div className="p-4 border border-blue-200 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50">
                      <h5 className="font-semibold text-blue-800 mb-3 text-sm sm:text-base">Student Account Status</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Account:</span>
                          <span className={`font-medium ${selected.paymentProof.createdRemoteUser.result?.created ? 'text-green-600' : 'text-yellow-600'}`}>
                            {selected.paymentProof.createdRemoteUser.result?.created ? 'Created Successfully' : 'Already Existed / Failed'}
                          </span>
                        </div>
                        {selected.paymentProof.createdRemoteUser.result?.passwordPlain && (
                          <div className="text-green-600 text-xs bg-green-50 p-2 rounded border border-green-200">
                            Temporary password was emailed to the student.
                          </div>
                        )}
                        {selected.paymentProof.createdRemoteUser.result?.error && (
                          <div className="text-red-600 mt-2 p-2 bg-red-50 rounded border border-red-200">
                            <strong>Error:</strong> {String(selected.paymentProof.createdRemoteUser.result.error)}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}