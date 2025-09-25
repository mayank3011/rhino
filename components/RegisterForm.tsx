// components/RegisterForm.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Image from "next/image"; // Import Next.js Image component

// --- Constants based on Logo ---
const PRIMARY_COLOR = "indigo-600";
const SECONDARY_COLOR = "violet-700";
const BUTTON_COLOR = "emerald-600";
const BUTTON_HOVER_COLOR = "emerald-700";

// --- Type Definitions ---

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

// Interface for the structured JSON response from /api/promocodes/apply
interface PromoResponse {
  ok: boolean;
  code: string;
  discountType: string;
  discountAmount: number;
  finalAmount: number;
  message?: string;
  error?: string;
}

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
      // If the currently typed promo doesn't match the applied code, clear the result.
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
      // 1. Fixed 'any' in local variable 'json'
      let json: Partial<PromoResponse> | null = null; 
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
      
      // Ensure we have required properties before proceeding
      if (typeof json.code !== 'string' || typeof json.discountAmount !== 'number' || typeof json.finalAmount !== 'number') {
        toast.error("Invalid data received from Promo API.");
        setPromoResult(null);
        return;
      }

      const appliedCode = String(json.code).trim().toUpperCase();
      const discountAmount = Number(json.discountAmount);
      const finalAmountResp = Number(json.finalAmount);

      setPromoResult({ code: appliedCode, discountAmount, finalAmount: finalAmountResp });
      setValue("promo", appliedCode);
      toast.success(`Promo applied — saved ₹${discountAmount}`);
    } catch (err) {
      // 2. Fixed 'any' in catch block
      const message = err instanceof Error ? err.message : "Promo apply failed";
      console.error("applyPromo error:", err);
      toast.error(message);
      setPromoResult(null);
    } finally {
      setApplying(false);
    }
  }

  async function onSubmit(vals: FormValues) {
    if (vals.promo && (!promoResult || promoResult.code.toUpperCase() !== vals.promo.trim().toUpperCase())) {
      // Re-run promo check if code is present but not applied (or applied code differs)
      await applyPromo(vals.promo);
      // Wait for promo to apply, then get the latest value (use the promoResult state in the next step)
    }

    const usedFinal = promoResult && vals.promo?.trim().toUpperCase() === promoResult.code.toUpperCase()
      ? promoResult.finalAmount
      : Number(vals.price ?? 0);

    if (usedFinal > 0) {
      // If amount > 0, redirect to payment with details in URL params
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

    // Handle FREE registration (amount is 0)
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
      // 3. Fixed 'any' in local variable 'j'
      let j: { message?: string; error?: string } | null = null; 
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
    } catch (err) {
      // 4. Fixed 'any' in catch block
      console.error("register error:", err);
      toast.error("Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="w-full py-8">
      <div className="flex flex-col-reverse lg:flex-row gap-8 max-w-7xl mx-auto">
        {/* Left: Course preview */}
        <aside className="w-full lg:w-7/12 order-2 lg:order-1">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="w-full h-64 md:h-80 bg-slate-50 flex items-center justify-center relative">
              {/* 5. Replaced <img> with Next.js <Image /> */}
              {course.image ? (
                <Image
                  src={course.image}
                  alt={course.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="text-xl text-slate-400 font-medium">Course Image</div>
              )}
            </div>

            <div className="p-6">
              <h2 className={`text-3xl font-bold text-${SECONDARY_COLOR} mb-3`}>{course.title}</h2>
              {course.description ? <p className="text-base text-slate-600 mb-4">{course.description}</p> : null}

              {/* Course Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6 border-y border-slate-100 py-4">
                <div>
                  <div className="text-xs text-slate-500">Date</div>
                  <div className="text-base font-semibold text-slate-800">Coming soon</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Time</div>
                  <div className="text-base font-semibold text-slate-800">7 PM IST</div>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <div className="text-xs text-slate-500">Duration</div>
                  <div className="text-base font-semibold text-slate-800">{course.duration ?? "—"}</div>
                </div>
              </div>

              {/* Price & Mentor */}
              <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
                <div>
                  <div className="text-sm text-slate-500">Total Price</div>
                  <div className="text-3xl font-extrabold text-slate-900">
                    {Number(course.price ?? 0) === 0 ? "Free" : `₹${Number(course.price ?? 0).toLocaleString("en-IN")}`}
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  {/* 6. Replaced <img> with Next.js <Image /> */}
                  {course.mentor?.image ? (
                    <Image src={course.mentor.image} alt={course.mentor.name || "Mentor"} width={48} height={48} className="w-12 h-12 rounded-full object-cover border" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-lg text-slate-700 font-bold flex-shrink-0">
                      {(course.mentor?.name ?? "?").slice(0, 1).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-900">{course.mentor?.name ?? "Instructor"}</div>
                    <div className="text-xs text-slate-500">{course.mentor?.role ?? "Course Mentor"}</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-4">
                <a href={`/course/${course.slug ?? course._id}`} className={`inline-block px-4 py-2 border rounded-lg text-sm font-medium border-${PRIMARY_COLOR} text-${PRIMARY_COLOR} hover:bg-${PRIMARY_COLOR} hover:text-white transition-colors`}>
                  View Course Details →
                </a>
              </div>
            </div>
          </div>
        </aside>

        {/* Right: Form */}
        <main className="w-full lg:w-5/12 order-1 lg:order-2">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xl">
            <div className="mb-6 pb-4 border-b border-slate-100">
              <div className="text-base text-slate-500 font-medium">Secure Your Spot</div>
              <div className={`font-bold text-2xl text-${PRIMARY_COLOR}`}>{course.title}</div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              
              {/* Name and Email - grouped for coherence */}
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input {...register("name", { required: true })} className="mt-2 w-full border border-slate-300 rounded-lg px-4 py-3 focus:border-indigo-500" placeholder="Your full name" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Email Id <span className="text-red-500">*</span>
                </label>
                <input {...register("email", { required: true })} type="email" className="mt-2 w-full border border-slate-300 rounded-lg px-4 py-3 bg-gray-50 focus:border-indigo-500" placeholder="you@example.com" />
              </div>

              {/* Country and Phone - responsive grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Country</label>
                  <select {...register("country")} className="mt-2 w-full border border-slate-300 rounded-lg px-4 py-3 focus:border-indigo-500">
                    <option value="IN">India: +91</option>
                    <option value="US">United States: +1</option>
                    <option value="UK">United Kingdom: +44</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">Phone Number</label>
                  <input {...register("phone")} className="mt-2 w-full border border-slate-300 rounded-lg px-4 py-3 focus:border-indigo-500" placeholder="Mobile number" />
                </div>
              </div>

              {/* Graduation Year */}
              <div>
                <label className="block text-sm font-medium text-slate-700">Graduation Year</label>
                <input {...register("graduationYear")} className="mt-2 w-full border border-slate-300 rounded-lg px-4 py-3 focus:border-indigo-500" placeholder="2027" />
              </div>

              {/* Promo Code Input & Apply */}
              <div>
                <label className="block text-sm font-medium text-slate-700">Promo code (optional)</label>
                <div className="flex gap-3 mt-2">
                  <input {...register("promo")} className="flex-1 border border-slate-300 rounded-lg px-4 py-3" placeholder="Enter promo code" />
                  <button
                    type="button"
                    onClick={() => applyPromo(watchedPromo)}
                    disabled={applying || !(watchedPromo ?? "").trim() || finalAmount === 0}
                    className={`px-4 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold transition-colors bg-${PRIMARY_COLOR} text-white hover:bg-${SECONDARY_COLOR} flex-shrink-0`}
                  >
                    {applying ? "Applying..." : promoResult ? "Applied" : "Apply"}
                  </button>
                </div>

                {promoResult && (
                  <div className="mt-3 p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-800">
                    ✅ Promo **{promoResult.code}** applied! You saved **₹{promoResult.discountAmount.toLocaleString("en-IN")}**.
                  </div>
                )}
              </div>
              
              {/* Hidden price fields (for debugging/internal logic) */}
              <input {...register("price", { valueAsNumber: true })} type="hidden" />
              <input {...register("course")} type="hidden" />

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-700">Notes</label>
                <textarea {...register("notes")} className="mt-2 w-full border border-slate-300 rounded-lg px-4 py-3 resize-none focus:border-indigo-500" rows={3} placeholder="Any notes for the instructor or team" />
              </div>

              {/* Final Amount & Submit Button */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-500">Amount to pay</div>
                  <div className="text-3xl font-extrabold text-slate-900">₹{Number(finalAmount).toLocaleString("en-IN")}</div>
                </div>

                <div>
                  <button type="submit" disabled={loading} className={`px-6 py-3 bg-${BUTTON_COLOR} hover:bg-${BUTTON_HOVER_COLOR} text-white rounded-xl text-base font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}>
                    {loading ? "Processing..." : finalAmount > 0 ? `Proceed to Pay ₹${Number(finalAmount).toLocaleString("en-IN")}` : "Register Now (Free)"}
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