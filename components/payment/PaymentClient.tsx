// components/payment/PaymentClient.tsx
"use client";

import React, { JSX, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import Image from "next/image";

type FormValues = {
  name: string;
  email: string;
  phone?: string;
  course?: string;
  promo?: string;
  amount?: number;
  method?: string;
  txnId?: string;
  notes?: string;
  screenshot?: string;
};

interface IRegStatus {
  _id: string;
  status: "awaiting_verification" | "pending" | "verified" | "rejected" | string;
  paymentProof?: {
    screenshot?: string;
    txnId?: string;
    submittedAt?: string;
    verifiedAt?: string;
    verifiedBy?: string;
    verificationNotes?: string;
  };
}

interface UploadResponse {
  url?: string;
  secure_url?: string;
  secureUrl?: string;
  secure?: string;
  error?: string;
  message?: string;
}

const COLOR_PRIMARY = "indigo-600";
const COLOR_ACCENT = "emerald-600";

export default function PaymentClient(): JSX.Element {
  const params = useSearchParams();

  const name = params?.get("name") ?? "";
  const email = params?.get("email") ?? "";
  const phone = params?.get("phone") ?? "";
  const course = params?.get("course") ?? "";
  const amountParam = params?.get("amount") ?? "0";
  const promo = params?.get("promo") ?? "";
  const initialAmount = Number(amountParam) || 0;

  const { register, handleSubmit, setValue, watch } = useForm<FormValues>({
    defaultValues: {
      name,
      email,
      phone,
      course,
      promo,
      amount: initialAmount,
      method: "gpay",
      txnId: "",
      notes: "",
      screenshot: "",
    },
  });

  const watchedMethod = watch("method");
  const watchedTxn = watch("txnId");

  const [uploading, setUploading] = useState(false);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const [regStatus, setRegStatus] = useState<IRegStatus | null>(null);
  const pollRef = useRef<number | null>(null);

  // keep amount synced if query param changes
  useEffect(() => {
    setValue("amount", initialAmount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialAmount]);

  function looksLikeTxnId(tx: string | undefined | null): boolean {
    if (!tx) return false;
    const s = String(tx).trim();
    const alnum = /^[A-Za-z0-9]{6,60}$/;
    const utrLike = /^[A-Za-z0-9\-]{6,60}$/;
    return alnum.test(s) || utrLike.test(s);
  }

  async function fileToDataUrl(file: File): Promise<string> {
    return await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }

  async function uploadDataUrlToServer(dataUrl: string): Promise<UploadResponse> {
    const res = await fetch("/api/admin/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataUrl }),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      try {
        const j = JSON.parse(txt) as { error?: string; message?: string } | null;
        throw new Error(j?.error || j?.message || `Upload failed (${res.status})`);
      } catch {
        throw new Error(`Upload failed (${res.status})`);
      }
    }
    const j = (await res.json()) as UploadResponse;
    return j;
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast.error("Please upload an image file (png/jpg).");
      return;
    }
    setUploading(true);
    toast.loading("Uploading screenshot...", { id: "upload" });
    try {
      const dataUrl = await fileToDataUrl(f);
      const json = await uploadDataUrlToServer(dataUrl);
      const url = json.url || json.secure_url || json.secureUrl || json.secure;
      if (!url) throw new Error(json.error || "Upload returned no url");
      setValue("screenshot", url);
      setScreenshotPreview(url);
      toast.dismiss("upload");
      toast.success("Screenshot uploaded");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      console.error("upload error", err);
      toast.dismiss("upload");
      toast.error(message);
    } finally {
      setUploading(false);
    }
  }

  function removeScreenshot() {
    setValue("screenshot", "");
    setScreenshotPreview(null);
  }

  // poll registration status
  useEffect(() => {
    if (!registrationId) return;

    let stopped = false;
    async function poll() {
      try {
        const res = await fetch(`/api/register/${encodeURIComponent(registrationId as string)}`);
        if (!res.ok) {
          console.warn("poll failed", res.status);
          return;
        }
        const json = (await res.json().catch(() => ({}))) as { registration?: IRegStatus };
        if (json.registration) {
          const r = json.registration;
          setRegStatus(r);
          if (r.status === "verified" || r.status === "rejected") {
            if (pollRef.current) {
              window.clearInterval(pollRef.current);
              pollRef.current = null;
            }
            stopped = true;
          }
        }
      } catch (err) {
        console.error("poll error", err);
      }
    }

    poll();
    const intervalId = window.setInterval(poll, 4000);
    pollRef.current = intervalId;

    return () => {
      if (!stopped && pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [registrationId]);

  // submit registration
  async function onConfirm(vals: FormValues) {
    if (!vals.txnId || !vals.txnId.trim()) {
      toast.error("Transaction / UTR ID is required");
      return;
    }
    if (!vals.screenshot) {
      toast.error("Please upload a screenshot for verification");
      return;
    }

    const payload = {
      name: vals.name,
      email: vals.email,
      phone: vals.phone,
      course: vals.course,
      promoCode: vals.promo ?? "",
      amount: Number(vals.amount ?? 0),
      paid: false,
      paymentProof: {
        method: vals.method,
        txnId: vals.txnId,
        screenshot: vals.screenshot,
        notes: vals.notes ?? "",
        submittedAt: new Date().toISOString(),
      },
      notes: vals.notes ?? "",
    };

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const raw = await res.text();
      let j:
        | { registrationId?: string; registration?: { _id: string }; message?: string; error?: string }
        | null = null;
      try {
        j = JSON.parse(raw);
      } catch {
        j = null;
      }

      if (!res.ok) {
        const msg = j?.message ?? j?.error ?? `Register failed (${res.status})`;
        toast.error(msg);
        return;
      }

      const regId = j?.registrationId ?? (j?.registration?._id ?? null);
      if (regId) {
        setRegistrationId(String(regId));
        toast.success("Submitted for verification. We'll notify you when verified.");
      } else {
        toast.success("Submitted for verification.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Submission failed";
      console.error("submit error", err);
      toast.error(message);
    }
  }

  // Render the same JSX you had — unchanged structure, moved into this client component
  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* QR / Info column */}
        <section className="order-2 lg:order-1 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xl">
            <div className="mb-4 border-b border-slate-100 pb-4">
              <div className="text-sm text-slate-500 font-medium">Final Amount Due</div>
              <div className={`text-4xl font-extrabold mt-1 text-${COLOR_PRIMARY}`}>
                ₹{Number(initialAmount).toLocaleString("en-IN")}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div className="w-full sm:w-48 h-48 bg-white rounded-lg border border-slate-300 overflow-hidden flex items-center justify-center flex-shrink-0">
                <Image src="/placeholder-qr.jpeg" alt="QR code" width={192} height={192} className="w-full h-full object-contain" />
              </div>

              <div className="flex-1 space-y-4">
                <div className="space-y-2">
                  <div className="text-xs text-slate-500 font-medium">Select Payment Method (For display/tracking)</div>
                  <div className="flex flex-wrap gap-2">
                    {["gpay", "phonepe", "paytm", "other"].map((method) => (
                      <label
                        key={method}
                        className={`px-3 py-1.5 rounded-full border border-slate-300 text-sm cursor-pointer transition-colors ${
                          watchedMethod === method ? `bg-${COLOR_PRIMARY} text-white border-${COLOR_PRIMARY}` : "bg-white text-gray-700 hover:bg-slate-50"
                        }`}
                      >
                        <input {...register("method")} type="radio" value={method} className="hidden" defaultChecked={method === "gpay"} />
                        {method.charAt(0).toUpperCase() + method.slice(1)}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="text-sm bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className={`font-semibold text-${COLOR_PRIMARY} mb-1`}>Important Tip:</div>
                  After payment, retrieve the <strong>Transaction ID (UTR)</strong> and take a clear <strong>screenshot</strong> showing the confirmation.
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-2 text-gray-700">Invoice Summary</h3>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-base">
                <span>Course:</span>
                <span className="font-medium text-gray-800">{course || "N/A"}</span>
              </div>
              <div className="flex justify-between text-base">
                <span>Total Amount:</span>
                <span className="font-medium text-gray-800">₹{Number(initialAmount).toLocaleString("en-IN")}</span>
              </div>
            </div>
            {promo && (
              <div className={`mt-3 text-xs bg-${COLOR_PRIMARY}/10 text-${COLOR_PRIMARY} px-3 py-1.5 rounded-full inline-block font-medium`}>
                Promo Code Applied: **{promo}**
              </div>
            )}
          </div>
        </section>

        {/* Form column */}
        <section className="order-1 lg:order-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xl">
            <h2 className="text-xl font-semibold mb-6 text-gray-800">Proof Submission</h2>
            <form onSubmit={handleSubmit(onConfirm)} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Name</label>
                  <input {...register("name")} className="mt-2 w-full border border-slate-300 rounded-lg px-4 py-2.5 bg-gray-50 cursor-not-allowed" disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Email</label>
                  <input {...register("email")} type="email" className="mt-2 w-full border border-slate-300 rounded-lg px-4 py-2.5 bg-gray-50 cursor-not-allowed" disabled />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Phone</label>
                  <input {...register("phone")} className="mt-2 w-full border border-slate-300 rounded-lg px-4 py-2.5" placeholder="Optional" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">Txn / UTR ID <span className="text-red-500">*</span></label>
                  <input {...register("txnId", { required: true })} className="mt-2 w-full border border-slate-300 rounded-lg px-4 py-2.5 font-mono" placeholder="AX12BCD34567890" />
                  <div className="mt-1 text-xs">
                    {watchedTxn ? (
                      looksLikeTxnId(watchedTxn) ? (
                        <span className="text-green-700">✅ Valid format</span>
                      ) : (
                        <span className="text-amber-700">⚠️ Txn ID format unusual — please verify it&apos;s correct.</span>
                      )
                    ) : null}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Upload payment screenshot <span className="text-red-500">*</span></label>

                {!screenshotPreview ? (
                  <div className="mt-2 flex items-center gap-3">
                    <input type="file" accept="image/*" onChange={handleFileChange} className="text-sm" disabled={uploading} />
                    {uploading && <div className="text-sm text-slate-600">Uploading...</div>}
                  </div>
                ) : (
                  <div className="mt-3 flex flex-col sm:flex-row items-start gap-4 p-3 border border-green-200 rounded-lg bg-green-50">
                    <Image src={screenshotPreview} alt="screenshot" width={144} height={96} className="w-36 h-24 object-cover rounded-md border flex-shrink-0" />
                    <div className="flex-1 space-y-1">
                      <div className="text-sm font-medium text-green-900">Proof Uploaded Successfully</div>
                      <div className="text-xs text-green-700 truncate">{screenshotPreview.split("/").pop()}</div>
                      <div className="flex gap-2 pt-1">
                        <button type="button" onClick={removeScreenshot} className="px-3 py-1 border border-green-300 rounded-lg text-sm bg-white text-red-600 hover:bg-red-50">
                          Remove
                        </button>
                        <a href={screenshotPreview} target="_blank" rel="noreferrer" className="px-3 py-1 border border-green-300 rounded-lg text-sm bg-white text-gray-700 hover:bg-slate-50">
                          View Original
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Notes (optional)</label>
                <textarea {...register("notes")} className="mt-2 w-full border border-slate-300 rounded-lg px-4 py-2.5" rows={3} placeholder="E.g., payment made from a different account." />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm text-slate-500">Amount Due</div>
                  <div className={`text-2xl font-bold text-${COLOR_PRIMARY}`}>₹{Number(initialAmount).toLocaleString("en-IN")}</div>
                </div>

                <button type="submit" disabled={uploading} className={`px-8 py-3 bg-${COLOR_ACCENT} hover:bg-emerald-700 text-white rounded-xl text-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}>
                  Confirm & Submit Proof
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>

      {registrationId && (
        <div className="mt-8 bg-white border border-slate-200 rounded-xl p-6 shadow-xl">
          <h3 className={`text-xl font-semibold mb-4 text-${COLOR_PRIMARY}`}>Submission Status</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="text-xs text-slate-500 font-medium">Uploaded Proof Screenshot</div>
              <div className="mt-2">
                {regStatus?.paymentProof?.screenshot ? (
                  <Image src={regStatus.paymentProof.screenshot} alt="proof" width={100} height={100} className="w-full h-32 object-cover rounded-md border" />
                ) : (
                  <div className="w-full h-32 bg-gray-50 rounded-md border flex items-center justify-center text-sm text-slate-500">No screenshot</div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-xs text-slate-500 font-medium">Transaction ID / UTR</div>
              <div className="font-mono text-sm font-medium text-gray-800">{regStatus?.paymentProof?.txnId ?? "—"}</div>

              <div className="text-xs text-slate-500 font-medium pt-2 border-t border-slate-100">Submitted On</div>
              <div className="text-sm text-gray-700">{regStatus?.paymentProof?.submittedAt ? new Date(regStatus.paymentProof.submittedAt).toLocaleString() : "—"}</div>
            </div>

            <div className="space-y-3">
              <div className="text-xs text-slate-500 font-medium">Verification Status</div>
              <div className="mt-2">
                {regStatus?.status === "awaiting_verification" && <div className="px-3 py-1 rounded-full text-sm font-semibold bg-yellow-50 text-yellow-800 border border-yellow-200">Awaiting Verification</div>}
                {regStatus?.status === "pending" && <div className="px-3 py-1 rounded-full text-sm font-semibold bg-slate-50 text-slate-700 border border-slate-200">Processing</div>}
                {regStatus?.status === "verified" && <div className="px-3 py-1 rounded-full text-sm font-semibold bg-green-50 text-green-800 border border-green-200">Verified ✓</div>}
                {regStatus?.status === "rejected" && <div className="px-3 py-1 rounded-full text-sm font-semibold bg-rose-50 text-rose-800 border border-rose-200">Rejected</div>}
              </div>

              {regStatus?.paymentProof?.verifiedAt && (
                <div className="mt-3 text-xs text-slate-600">
                  Verified at {new Date(regStatus.paymentProof.verifiedAt).toLocaleDateString()}
                  {regStatus.paymentProof.verifiedBy ? <div>By: {regStatus.paymentProof.verifiedBy}</div> : null}
                </div>
              )}

              {regStatus?.paymentProof?.verificationNotes && (
                <div className="mt-3 p-3 text-sm bg-slate-50 rounded-lg border text-slate-700">
                  <strong>Admin Note:</strong> {regStatus.paymentProof.verificationNotes}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <p className="mt-8 text-sm text-slate-500 text-center">
        <strong>Important:</strong> After submission, our team manually verifies the payment proof. You will receive a confirmation email when your status changes.
      </p>
    </div>
  );
}
