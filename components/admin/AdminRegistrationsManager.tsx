// components/admin/AdminRegistrationsManager.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import fetcher from "@/utils/fetcher";
import toast from "react-hot-toast";

function qs(o: Record<string, any>) {
  return Object.entries(o)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
}

export default function AdminRegistrationsManager() {
  const [status, setStatus] = useState<string>("awaiting_verification");
  const [q, setQ] = useState<string>("");
  const [debouncedQ, setDebouncedQ] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(12);

  const [selected, setSelected] = useState<any | null>(null);
  const [notes, setNotes] = useState<string>("");
  const [processing, setProcessing] = useState(false);
  const [markPaid, setMarkPaid] = useState<boolean>(true); // option to override paid flag when verifying

  // debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  // reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [status, debouncedQ, limit]);

  const key = `/api/admin/registrations?${qs({ status, q: debouncedQ, page, limit })}`;
  const { data, error, mutate } = useSWR(key, fetcher, { revalidateOnFocus: false });

  const regs = data?.registrations ?? [];
  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil((total || 0) / limit));

  // open details for a registration
  function openDetails(r: any) {
    setSelected(r);
    setNotes(r.paymentProof?.verificationNotes ?? "");
    setMarkPaid(true);
  }

  // helper to open screenshot or url in new tab
  function openUrl(url?: string) {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  // perform verify / reject action
  async function doAction(id: string, action: "verify" | "reject") {
    if (!confirm(`Are you sure you want to ${action} this registration?`)) return;
    setProcessing(true);
    try {
      const body: any = { action, verificationNotes: notes };
      if (action === "verify") body.paid = !!markPaid;

      const res = await fetch(`/api/admin/registrations/${id}/verify`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });

      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        // server returned error
        const message = j?.message || j?.error || `Action failed (${res.status})`;
        toast.error(message);
        console.error("verify failed:", j);
        return;
      }

      // success — server returns updated registration and email result if present
      toast.success(action === "verify" ? "Verified" : "Rejected");

      // show email send info if present
      if (j?.email) {
        if (j.email.ok) {
          const mid = j.email?.resp?.[0]?.headers?.["x-message-id"] ?? j.email?.resp?.[0]?.headers?.["x-message-id".toLowerCase()];
          toast.success(`Notification queued${mid ? ` (id: ${String(mid).slice(0, 12)})` : ""}`);
        } else if (j.email?.error) {
          toast.error(`Email: ${j.email.error}`);
        }
      }

      // refresh list & clear modal
      await mutate();
      setSelected(null);
    } catch (err: any) {
      console.error("admin action error", err);
      toast.error(err?.message || "Action failed");
    } finally {
      setProcessing(false);
    }
  }

  if (error) return <div className="text-red-600">Failed to load registrations</div>;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="p-2 border rounded">
            <option value="">All</option>
            <option value="awaiting_verification">Awaiting verification</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>

          <select value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="p-2 border rounded">
            <option value={6}>6</option>
            <option value={12}>12</option>
            <option value={24}>24</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            placeholder="Search name / email / txn"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="p-2 border rounded"
          />
          <button onClick={() => mutate()} className="px-3 py-2 bg-indigo-600 text-white rounded">Search</button>
        </div>
      </div>

      {/* list */}
      {regs.length === 0 ? (
        <div className="p-4 bg-white rounded border text-sm text-slate-600">No registrations.</div>
      ) : (
        <div className="grid gap-3">
          {regs.map((r: any) => (
            <div key={r._id} className="bg-white border rounded p-3 flex items-start gap-3">
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold">{r.name}</div>
                    <div className="text-sm text-slate-500">{r.email} • {r.phone ?? "—"}</div>
                    <div className="text-sm mt-1">Course: <strong>{r.course}</strong></div>
                  </div>
                  <div className="text-xs text-slate-500">{new Date(r.createdAt).toLocaleString()}</div>
                </div>

                <div className="mt-3 flex items-center gap-4 flex-wrap">
                  <div className="text-sm">Txn: <span className="font-medium">{r.paymentProof?.txnId ?? "—"}</span></div>
                  <div className="text-sm">Amount: <span className="font-medium">₹{Number(r.amount || 0).toLocaleString()}</span></div>

                  {/* Email status badge */}
                  <div>
                    {r.paymentProof?.email ? (
                      r.paymentProof.email.ok ? (
                        <span className="inline-flex items-center gap-2 px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs">
                          Sent ✓
                          {r.paymentProof.email.messageId ? <span className="text-xs text-slate-600">#{String(r.paymentProof.email.messageId).slice(0, 10)}</span> : null}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 px-2 py-0.5 bg-rose-100 text-rose-800 rounded text-xs" title={r.paymentProof.email.error || "send failed"}>
                          Send failed
                        </span>
                      )
                    ) : (
                      <span className="inline-flex items-center gap-2 px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs">Not sent</span>
                    )}
                  </div>

                  {/* webhook last event */}
                  {r.paymentProof?.email?.lastEvent ? (
                    <div className="text-xs text-slate-500">Event: <span className="font-medium">{r.paymentProof.email.lastEvent}</span></div>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <button onClick={() => openDetails(r)} className="px-3 py-1 border rounded text-sm">View</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-600">Total: {total}</div>
        <div className="flex items-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-2 py-1 border rounded">Prev</button>
          <div className="px-3 py-1 border rounded">{page} / {pages}</div>
          <button disabled={page >= pages} onClick={() => setPage((p) => Math.min(pages, p + 1))} className="px-2 py-1 border rounded">Next</button>
        </div>
      </div>

      {/* modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
          <div className="bg-white rounded-lg max-w-4xl w-full p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">{selected.name}</h3>
                <div className="text-sm text-slate-500">{selected.email} • {selected.phone}</div>
                <div className="mt-2 text-sm">Course: <strong>{selected.course}</strong></div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className="text-xs text-slate-500">{new Date(selected.createdAt).toLocaleString()}</div>
                <button onClick={() => setSelected(null)} className="px-3 py-1 border rounded">Close</button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* left: screenshots / gallery */}
              <div>
                <div className="text-xs text-slate-500">Payment screenshot</div>

                {/* support an array or single string */}
                {selected.paymentProof?.screenshots && Array.isArray(selected.paymentProof.screenshots) && selected.paymentProof.screenshots.length > 0 ? (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {selected.paymentProof.screenshots.map((s: string, i: number) => (
                      <button key={i} onClick={() => openUrl(s)} className="border rounded overflow-hidden">
                        <img src={s} alt={`screenshot-${i}`} className="w-full h-36 object-cover" />
                      </button>
                    ))}
                  </div>
                ) : selected.paymentProof?.screenshot ? (
                  <div className="mt-2">
                    <button onClick={() => openUrl(selected.paymentProof.screenshot)}>
                      <img src={selected.paymentProof.screenshot} alt="screenshot" className="w-full h-60 object-cover rounded border" />
                    </button>
                  </div>
                ) : (
                  <div className="mt-2 text-sm text-slate-500">No screenshot</div>
                )}

                {/* small info */}
                <div className="mt-3 text-sm">
                  <div>Txn ID: <span className="font-medium">{selected.paymentProof?.txnId ?? "—"}</span></div>
                  <div className="mt-1">Amount: <span className="font-medium">₹{Number(selected.amount || 0).toLocaleString()}</span></div>
                </div>
              </div>

              {/* right: notes / email meta / actions */}
              <div>
                <div className="text-xs text-slate-500">Transaction ID</div>
                <div className="font-medium mt-1">{selected.paymentProof?.txnId ?? "—"}</div>

                <div className="mt-4">
                  <label className="block text-xs text-slate-500">Verification notes</label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={5} className="w-full border rounded p-2 mt-1" />
                </div>

                <div className="mt-3">
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={markPaid} onChange={(e) => setMarkPaid(e.target.checked)} />
                    Mark paid when verifying
                  </label>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex gap-2">
                    <button disabled={processing} onClick={() => doAction(selected._id, "verify")} className="px-4 py-2 bg-green-600 text-white rounded">
                      {processing ? "Working..." : "Verify & Mark Paid"}
                    </button>
                    <button disabled={processing} onClick={() => doAction(selected._id, "reject")} className="px-4 py-2 bg-rose-600 text-white rounded">
                      {processing ? "Working..." : "Reject"}
                    </button>
                  </div>

                  {/* display email send meta */}
                  {selected.paymentProof?.email ? (
                    <div className="mt-3 p-3 border rounded bg-slate-50 text-sm">
                      <div className="font-medium">Email notification</div>
                      <div className="mt-1">Sent: {selected.paymentProof.email.ok ? "Yes" : "No"}</div>
                      {selected.paymentProof.email.messageId && (
                        <div>Message-id: <code className="text-xs">{selected.paymentProof.email.messageId}</code></div>
                      )}
                      {selected.paymentProof.email.error && (
                        <div className="text-rose-600 mt-1">Error: {selected.paymentProof.email.error}</div>
                      )}
                      {selected.paymentProof.email.lastEvent && (
                        <div className="mt-1">Last event: <span className="font-medium">{selected.paymentProof.email.lastEvent}</span></div>
                      )}
                      {selected.paymentProof.email.sentAt && (
                        <div className="text-xs text-slate-500 mt-1">Sent at: {new Date(selected.paymentProof.email.sentAt).toLocaleString()}</div>
                      )}
                      {selected.paymentProof?.createdRemoteUser ? (
  <div className="mt-3 p-3 border rounded bg-slate-50 text-sm">
    <div className="font-medium">Student account</div>
    <div className="mt-1">{selected.paymentProof.createdRemoteUser.result?.created ? "Created" : "Already existed / Failed"}</div>
    {selected.paymentProof.createdRemoteUser.result?.passwordPlain && (
      <div className="text-xs text-slate-600">Temporary password was emailed to the student.</div>
    )}
    {selected.paymentProof.createdRemoteUser.result?.error && (
      <div className="text-rose-600">Error: {String(selected.paymentProof.createdRemoteUser.result.error)}</div>
    )}
  </div>
) : null}

                    </div>
                    
                  ) : (
                    <div className="mt-3 text-sm text-slate-500">No email notification recorded for this registration.</div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
      
    </div>
  );
}
