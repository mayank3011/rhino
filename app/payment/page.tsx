// app/payment/page.tsx
"use client";

import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

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

export default function PaymentPage() {
  const params = useSearchParams();
  const router = useRouter();

  // query params
  const name = params?.get("name") ?? "";
  const email = params?.get("email") ?? "";
  const phone = params?.get("phone") ?? "";
  const course = params?.get("course") ?? "";
  const amountParam = params?.get("amount") ?? "0";
  const promo = params?.get("promo") ?? "";
  const initialAmount = Number(amountParam) || 0;

  const { register, handleSubmit, setValue, watch, reset } = useForm<FormValues>({
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
  const watchedScreenshot = watch("screenshot");
  const watchedTxn = watch("txnId");

  const [uploading, setUploading] = useState(false);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const [regStatus, setRegStatus] = useState<any>(null);
  const pollRef = useRef<number | null>(null);

  // set amount from query param if it changes
  useEffect(() => {
    setValue("amount", initialAmount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialAmount]);

  // heuristic txn id validator
  function looksLikeTxnId(tx: string | undefined | null) {
    if (!tx) return false;
    const s = String(tx).trim();
    // allow alnum or alnum + dashes, length 6-40
    const alnum = /^[A-Za-z0-9]{6,40}$/;
    const utrLike = /^[A-Za-z0-9\-]{6,60}$/;
    return alnum.test(s) || utrLike.test(s);
  }

  async function fileToDataUrl(file: File) {
    return await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }

  async function uploadDataUrlToServer(dataUrl: string) {
    const res = await fetch("/api/admin/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataUrl }),
    });
    if (!res.ok) {
      // try to parse json error otherwise throw status
      const txt = await res.text().catch(() => "");
      try {
        const j = JSON.parse(txt);
        throw new Error(j?.error || j?.message || `Upload failed (${res.status})`);
      } catch {
        throw new Error(`Upload failed (${res.status})`);
      }
    }
    const j = await res.json();
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
    toast.loading("Uploading screenshot...");
    try {
      const dataUrl = await fileToDataUrl(f);
      const json = await uploadDataUrlToServer(dataUrl);
      const url = json.url || json.secure_url || json.secureUrl || json.secure;
      if (!url) throw new Error("Upload returned no url");
      setValue("screenshot", url);
      setScreenshotPreview(url);
      toast.dismiss();
      toast.success("Screenshot uploaded");
    } catch (err: any) {
      console.error("upload error", err);
      toast.dismiss();
      toast.error(err?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function removeScreenshot() {
    setValue("screenshot", "");
    setScreenshotPreview(null);
  }

  // poll registration status if registrationId set
  useEffect(() => {
    if (!registrationId) return;
    let stopped = false;

    async function poll() {
      try {
        const res = await fetch(`/api/register/${encodeURIComponent(registrationId)}`);
        if (!res.ok) {
          // don't spam console for temporary failures
          console.warn("poll failed", res.status);
          return;
        }
        const json = await res.json().catch(() => ({}));
        if (json?.registration) {
          setRegStatus(json.registration);
          if (json.registration.status === "verified" || json.registration.status === "rejected") {
            stopped = true;
            if (pollRef.current) window.clearInterval(pollRef.current);
            pollRef.current = null;
          }
        }
      } catch (err) {
        console.error("poll error", err);
      }
    }

    poll();
    pollRef.current = window.setInterval(poll, 4000);

    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
      pollRef.current = null;
    };
  }, [registrationId]);

  // form submit => create registration with paymentProof (unverified)
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
      console.log("register response raw:", raw);
      let j = null;
      try { j = JSON.parse(raw); } catch { j = null; }

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
    } catch (err: any) {
      console.error("submit error", err);
      toast.error(err?.message || "Submission failed");
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-semibold mb-6">Payment & upload proof</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* QR / Info column */}
        <section className="order-2 md:order-1">
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <div className="mb-3">
              <div className="text-sm text-slate-500">Scan QR to pay</div>
              <div className="text-lg font-semibold">Amount</div>
              <div className="text-2xl font-bold mt-1">₹{Number(initialAmount).toLocaleString("en-IN")}</div>
            </div>

            <div className="flex flex-col md:flex-row items-start gap-4">
              <div className="w-full md:w-56 h-56 bg-white rounded-lg border overflow-hidden flex items-center justify-center">
                {/* Replace placeholder with your generated QR or remote image */}
                <img src="/placeholder-qr.jpeg" alt="QR code" className="w-full h-full object-contain" />
              </div>

              <div className="flex-1">
                <div className="mb-3">
                  <div className="text-xs text-slate-500">Payment method</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <label className={`px-3 py-1 rounded border cursor-pointer ${watchedMethod === "gpay" ? "bg-slate-100" : ""}`}>
                      <input {...register("method")} type="radio" value="gpay" className="hidden" defaultChecked />
                      Google Pay
                    </label>
                    <label className={`px-3 py-1 rounded border cursor-pointer ${watchedMethod === "phonepe" ? "bg-slate-100" : ""}`}>
                      <input {...register("method")} type="radio" value="phonepe" className="hidden" />
                      PhonePe
                    </label>
                    <label className={`px-3 py-1 rounded border cursor-pointer ${watchedMethod === "paytm" ? "bg-slate-100" : ""}`}>
                      <input {...register("method")} type="radio" value="paytm" className="hidden" />
                      PayTM
                    </label>
                    <label className={`px-3 py-1 rounded border cursor-pointer ${watchedMethod === "other" ? "bg-slate-100" : ""}`}>
                      <input {...register("method")} type="radio" value="other" className="hidden" />
                      Other
                    </label>
                  </div>
                </div>

                <div className="text-xs text-slate-500">Tip</div>
                <div className="mt-2 text-sm text-slate-700">
                  After payment, copy the transaction ID (UTR) shown by your UPI app and upload a screenshot showing the success/confirmation.
                </div>
              </div>
            </div>
          </div>

          {/* Small status card */}
          <div className="mt-4 bg-white border rounded-lg p-3">
            <div className="text-sm text-slate-500">Invoice</div>
            <div className="mt-2 font-medium">{course || "—"}</div>
            <div className="mt-1 text-sm text-slate-600">Amount: <span className="font-semibold">₹{Number(initialAmount).toLocaleString("en-IN")}</span></div>
            {promo ? <div className="mt-2 text-xs bg-green-50 text-green-700 px-2 py-1 rounded inline-block">Promo: {promo}</div> : null}
          </div>
        </section>

        {/* Form column */}
        <section className="order-1 md:order-2">
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <form onSubmit={handleSubmit(onConfirm)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Name</label>
                <input {...register("name", { required: true })} className="mt-2 w-full border rounded px-3 py-2" />
              </div>

              <div>
                <label className="block text-sm font-medium">Email</label>
                <input {...register("email", { required: true })} type="email" className="mt-2 w-full border rounded px-3 py-2" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">Phone</label>
                  <input {...register("phone")} className="mt-2 w-full border rounded px-3 py-2" />
                </div>

                <div>
                  <label className="block text-sm font-medium">Txn / UTR ID <span className="text-red-500">*</span></label>
                  <input {...register("txnId", { required: true })} className="mt-2 w-full border rounded px-3 py-2" placeholder="e.g. AX12BCD3456" />
                  <div className="mt-1 text-xs">
                    {watchedTxn ? (
                      looksLikeTxnId(watchedTxn) ? (
                        <span className="text-green-700">Looks like a valid txn id</span>
                      ) : (
                        <span className="text-amber-700">Txn id looks unusual — double-check</span>
                      )
                    ) : null}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium">Upload payment screenshot <span className="text-red-500">*</span></label>
                <div className="mt-2 flex items-center gap-3">
                  <input type="file" accept="image/*" onChange={handleFileChange} />
                  {uploading && <div className="text-sm text-slate-600">Uploading...</div>}
                </div>

                {screenshotPreview ? (
                  <div className="mt-3 flex items-start gap-3">
                    <img src={screenshotPreview} alt="screenshot" className="w-36 h-24 object-cover rounded border" />
                    <div className="flex-1">
                      <div className="text-sm">{screenshotPreview.split("/").pop()}</div>
                      <div className="mt-2 flex gap-2">
                        <button type="button" onClick={removeScreenshot} className="px-2 py-1 border rounded text-sm">Remove</button>
                        <a href={screenshotPreview} target="_blank" rel="noreferrer" className="px-2 py-1 border rounded text-sm">Open</a>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-slate-500">Upload a screenshot showing your successful payment confirmation.</div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium">Notes (optional)</label>
                <textarea {...register("notes")} className="mt-2 w-full border rounded px-3 py-2" rows={3} />
              </div>

              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-slate-500">Amount</div>
                  <div className="text-xl font-bold">₹{Number(initialAmount).toLocaleString("en-IN")}</div>
                </div>

                <div>
                  <button type="submit" disabled={uploading} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded">
                    Confirm & Submit
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Submission gallery + status */}
          {registrationId && (
            <div className="mt-4 bg-white border rounded-lg p-4 shadow-sm">
              <h3 className="text-sm font-semibold mb-3">Submission</h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <div className="text-xs text-slate-500">Uploaded proof</div>
                  <div className="mt-2">
                    {regStatus?.paymentProof?.screenshot ? (
                      <img src={regStatus.paymentProof.screenshot} alt="proof" className="w-full h-32 object-cover rounded border" />
                    ) : (
                      <div className="w-full h-32 bg-gray-50 rounded border flex items-center justify-center text-sm text-slate-500">No screenshot</div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-500">Transaction</div>
                  <div className="mt-2 font-medium">{regStatus?.paymentProof?.txnId ?? "—"}</div>

                  <div className="mt-3 text-xs text-slate-500">Submitted</div>
                  <div className="mt-1">{regStatus?.paymentProof?.submittedAt ? new Date(regStatus.paymentProof.submittedAt).toLocaleString() : "—"}</div>
                </div>

                <div>
                  <div className="text-xs text-slate-500">Verification status</div>
                  <div className="mt-2">
                    {regStatus?.status === "awaiting_verification" && <div className="px-3 py-1 rounded bg-yellow-50 text-yellow-800">Awaiting verification</div>}
                    {regStatus?.status === "pending" && <div className="px-3 py-1 rounded bg-slate-50 text-slate-700">Pending</div>}
                    {regStatus?.status === "verified" && <div className="px-3 py-1 rounded bg-green-50 text-green-800">Verified ✓</div>}
                    {regStatus?.status === "rejected" && <div className="px-3 py-1 rounded bg-rose-50 text-rose-800">Rejected</div>}
                  </div>

                  {regStatus?.paymentProof?.verifiedAt && (
                    <div className="mt-3 text-xs">
                      Verified at {new Date(regStatus.paymentProof.verifiedAt).toLocaleString()}
                      {regStatus.paymentProof.verifiedBy ? <div className="text-xs text-slate-500">By: {regStatus.paymentProof.verifiedBy}</div> : null}
                    </div>
                  )}

                  {regStatus?.paymentProof?.verificationNotes && (
                    <div className="mt-3 text-sm text-slate-700">
                      Admin note: {regStatus.paymentProof.verificationNotes}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      <p className="mt-6 text-sm text-slate-500">
        After submission, our team will verify the payment and confirm your seat. You will receive an email after verification.
      </p>
    </div>
  );
}
