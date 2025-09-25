// components/RegisterForm.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

type CourseData = {
  _id: string;
  title: string;
  slug?: string;
  description?: string;
  price?: number;
  duration?: string;
  image?: string;
  mentor?: { name?: string; image?: string; role?: string } | null;
};

type FormValues = {
  name: string;
  email: string;
  phone?: string;
  country?: string;
  graduationYear?: string;
  course?: string;
  promo?: string;
  price?: number;
  notes?: string;
};

export default function RegisterForm({ course }: { course: CourseData }) {
  const router = useRouter();
  const { register, handleSubmit, setValue, watch, reset } = useForm<FormValues>({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      country: "IN",
      graduationYear: "",
      course: course.slug ?? course._id,
      promo: "",
      price: course.price ?? 0,
      notes: "",
    },
  });

  const [applying, setApplying] = useState(false);
  const [promoResult, setPromoResult] = useState<null | { code: string; discountAmount: number; finalAmount: number }>(null);
  const [loading, setLoading] = useState(false);

  const watchedPrice = watch("price");
  const watchedPromo = watch("promo");

  useEffect(() => {
    setValue("price", course.price ?? 0);
    setValue("course", course.slug ?? course._id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course]);

  useEffect(() => {
    setPromoResult((prev) => {
      if (!prev) return null;
      if ((watchedPromo ?? "").trim().toUpperCase() !== prev.code.toUpperCase()) return null;
      return prev;
    });
  }, [watchedPromo]);

  const finalAmount = promoResult ? promoResult.finalAmount : Number(watchedPrice ?? 0);

  async function applyPromo(codeArg?: string) {
    const code = (codeArg ?? (watch("promo") ?? "")).trim();
    if (!code) {
      toast.error("Enter a promo code to apply");
      return;
    }

    if (promoResult && promoResult.code.toUpperCase() === code.toUpperCase()) {
      toast.success(`Promo ${promoResult.code} already applied`);
      return;
    }

    const amount = Number(watch("price") ?? 0);
    if (!Number.isFinite(amount) || amount < 0) {
      toast.error("Invalid course price");
      return;
    }

    setApplying(true);
    setPromoResult(null);

    try {
      const res = await fetch("/api/promocodes/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, amount }),
      });

      const text = await res.text();
      let json: any = null;
      try {
        json = JSON.parse(text);
      } catch {
        toast.error("Unexpected response from promo API");
        setPromoResult(null);
        return;
      }

      if (!res.ok) {
        const message = json?.message ?? json?.error ?? `Apply failed (${res.status})`;
        toast.error(message);
        setPromoResult(null);
        return;
      }

      if (!json || !json.ok) {
        toast.error(json?.message ?? "Promo API returned unexpected response");
        setPromoResult(null);
        return;
      }

      const appliedCode = String(json.code ?? code).trim().toUpperCase();
      const discountAmount = Number(json.discountAmount ?? 0);
      const finalAmountResp = Number(json.finalAmount ?? amount);

      setPromoResult({ code: appliedCode, discountAmount, finalAmount: finalAmountResp });
      setValue("promo", appliedCode);
      toast.success(`Promo applied — saved ₹${discountAmount}`);
    } catch (err: any) {
      console.error("applyPromo error:", err);
      toast.error(err?.message || "Promo apply failed");
      setPromoResult(null);
    } finally {
      setApplying(false);
    }
  }

  async function onSubmit(vals: FormValues) {
    if (vals.promo && (!promoResult || promoResult.code.toUpperCase() !== vals.promo.trim().toUpperCase())) {
      await applyPromo(vals.promo);
    }

    const usedFinal = promoResult && vals.promo?.trim().toUpperCase() === promoResult.code.toUpperCase()
      ? promoResult.finalAmount
      : Number(vals.price ?? 0);

    if (usedFinal > 0) {
      const params = new URLSearchParams({
        name: vals.name,
        email: vals.email,
        phone: vals.phone ?? "",
        course: String(vals.course ?? ""),
        promo: vals.promo ?? "",
        amount: String(usedFinal),
      });
      router.push(`/payment?${params.toString()}`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: vals.name,
          email: vals.email,
          phone: vals.phone,
          course: vals.course,
          promoCode: vals.promo ?? "",
          amount: usedFinal,
          paid: usedFinal === 0,
          notes: vals.notes ?? "",
        }),
      });

      const text = await res.text();
      let j: any = null;
      try { j = JSON.parse(text); } catch { j = null; }

      if (!res.ok) {
        const message = j?.message ?? j?.error ?? `Register failed (${res.status})`;
        toast.error(message);
        return;
      }

      toast.success("Registered successfully" + (usedFinal === 0 ? " — marked as paid" : ""));
      reset();
      setPromoResult(null);
      router.push(`/course/${course.slug ?? course._id}/thank-you`);
    } catch (err: any) {
      console.error("register error:", err);
      toast.error("Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="w-full">
      <div className="flex flex-col-reverse lg:flex-row gap-8">
        {/* Left: Course preview (on small screens this appears below form due to flex-col-reverse) */}
        <aside className="w-full lg:w-7/12 order-2 lg:order-1">
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="w-full h-64 md:h-80 bg-slate-50 flex items-center justify-center">
              {course.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={course.image} alt={course.title} className="w-full h-full object-cover" />
              ) : (
                <div className="text-slate-400">No image</div>
              )}
            </div>

            <div className="p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">{course.title}</h2>
              {course.description ? <p className="text-sm text-slate-600 mb-4">{course.description}</p> : null}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-slate-500">Date</div>
                  <div className="text-sm font-semibold">Coming soon</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Time</div>
                  <div className="text-sm font-semibold">7 PM IST</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Duration</div>
                  <div className="text-sm font-semibold">{course.duration ?? "—"}</div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-slate-500">Price</div>
                  <div className="text-2xl font-extrabold text-slate-900">
                    {Number(course.price ?? 0) === 0 ? "Free" : `₹${Number(course.price ?? 0).toLocaleString("en-IN")}`}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {course.mentor?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={course.mentor.image} alt={course.mentor.name} className="w-14 h-14 rounded-full object-cover border" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-sm text-slate-700">
                      {(course.mentor?.name ?? "?").slice(0, 1).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-900">{course.mentor?.name ?? "Instructor"}</div>
                    <div className="text-xs text-slate-500">{course.mentor?.role ?? ""}</div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <a href={`/course/${course.slug ?? course._id}`} className="inline-block px-4 py-2 border rounded-md text-sm hover:bg-slate-50">
                  View course details
                </a>
              </div>
            </div>
          </div>
        </aside>

        {/* Right: Form */}
        <main className="w-full lg:w-5/12 order-1 lg:order-2">
          <div className="bg-white rounded-2xl p-6 border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs text-slate-500">Registering For</div>
                <div className="font-semibold">{course.title}</div>
              </div>
              <div className="text-sm text-slate-700">
                Batch: <strong>Batch 1</strong>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input {...register("name", { required: true })} className="mt-2 w-full border rounded px-3 py-2" placeholder="Your full name" />
              </div>

              <div>
                <label className="block text-sm font-medium">
                  Email Id <span className="text-red-500">*</span>
                </label>
                <input {...register("email", { required: true })} type="email" className="mt-2 w-full border rounded px-3 py-2 bg-gray-50" placeholder="you@example.com" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">Country</label>
                  <select {...register("country")} className="mt-2 w-full border rounded px-3 py-2">
                    <option value="IN">India: +91</option>
                    <option value="US">United States: +1</option>
                    <option value="UK">United Kingdom: +44</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium">Phone Number</label>
                  <input {...register("phone")} className="mt-2 w-full border rounded px-3 py-2" placeholder="Mobile number" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium">Graduation Year</label>
                <input {...register("graduationYear")} className="mt-2 w-full border rounded px-3 py-2" placeholder="2027" />
              </div>

              <div>
                <label className="block text-sm font-medium">Course price (₹)</label>
                <input {...register("price", { valueAsNumber: true })} type="number" className="mt-2 w-full border rounded px-3 py-2" disabled />
              </div>

              <div>
                <label className="block text-sm font-medium">Promo code (optional)</label>
                <div className="flex gap-2 mt-2">
                  <input {...register("promo")} className="flex-1 border rounded px-3 py-2" placeholder="Enter promo code" />
                  <button
                    type="button"
                    onClick={() => applyPromo(watchedPromo)}
                    disabled={applying || !(watchedPromo ?? "").trim()}
                    className="px-4 py-2 bg-slate-100 rounded disabled:opacity-60"
                  >
                    {applying ? "Applying..." : promoResult ? "Applied" : "Apply"}
                  </button>
                </div>

                {promoResult && (
                  <div className="mt-2 p-2 rounded bg-green-50 text-sm text-green-800">
                    Promo <strong>{promoResult.code}</strong> applied — discount ₹{promoResult.discountAmount} — final ₹{promoResult.finalAmount}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium">Notes</label>
                <textarea {...register("notes")} className="mt-2 w-full border rounded px-3 py-2" rows={3} placeholder="Any notes for the instructor or team" />
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500">Amount to pay</div>
                  <div className="text-2xl font-bold">₹{Number(finalAmount).toLocaleString("en-IN")}</div>
                </div>

                <div>
                  <button type="submit" disabled={loading} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg">
                    {loading ? "Processing..." : finalAmount > 0 ? `Proceed to Pay ₹${Number(finalAmount).toLocaleString("en-IN")}` : "Save & Continue"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </main>
      </div>
    </section>
  );
}
