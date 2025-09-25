// components/RegisterForm.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Image from "next/image";

// Types
interface CourseData {
  _id: string;
  title: string;
  slug?: string;
  description?: string;
  price?: number;
  duration?: string;
  image?: string;
  mentor?: { 
    name?: string; 
    image?: string; 
    role?: string; 
  } | null;
}

interface FormValues {
  name: string;
  email: string;
  phone?: string;
  country?: string;
  graduationYear?: string;
  course?: string;
  promo?: string;
  price?: number;
  notes?: string;
}

interface PromoResult {
  code: string;
  discountAmount: number;
  finalAmount: number;
}

interface RegisterFormProps {
  course: CourseData;
}

export default function RegisterForm({ course }: RegisterFormProps) {
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
  const [promoResult, setPromoResult] = useState<PromoResult | null>(null);
  const [loading, setLoading] = useState(false);

  const watchedPrice = watch("price");
  const watchedPromo = watch("promo");

  // Update form when course changes
  useEffect(() => {
    setValue("price", course.price ?? 0);
    setValue("course", course.slug ?? course._id);
  }, [course, setValue]);

  // Reset promo if code changes
  useEffect(() => {
    setPromoResult((prev) => {
      if (!prev) return null;
      if ((watchedPromo ?? "").trim().toUpperCase() !== prev.code.toUpperCase()) return null;
      return prev;
    });
  }, [watchedPromo]);

  const finalAmount = promoResult ? promoResult.finalAmount : Number(watchedPrice ?? 0);

  async function applyPromo(codeArg?: string): Promise<void> {
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
      const response = await fetch("/api/promocodes/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, amount }),
      });

      const text = await response.text();
      let jsonData: unknown = null;
      try {
        jsonData = JSON.parse(text);
      } catch {
        toast.error("Unexpected response from promo API");
        setPromoResult(null);
        return;
      }

      const json = jsonData as Record<string, unknown>;

      if (!response.ok) {
        const message = (json?.message as string) ?? (json?.error as string) ?? `Apply failed (${response.status})`;
        toast.error(message);
        setPromoResult(null);
        return;
      }

      if (!json || !json.ok) {
        toast.error((json?.message as string) ?? "Promo API returned unexpected response");
        setPromoResult(null);
        return;
      }

      const appliedCode = String(json.code ?? code).trim().toUpperCase();
      const discountAmount = Number(json.discountAmount ?? 0);
      const finalAmountResp = Number(json.finalAmount ?? amount);

      setPromoResult({ code: appliedCode, discountAmount, finalAmount: finalAmountResp });
      setValue("promo", appliedCode);
      toast.success(`Promo applied — saved ₹${discountAmount}`);
    } catch (error: unknown) {
      console.error("applyPromo error:", error);
      const message = error instanceof Error ? error.message : "Promo apply failed";
      toast.error(message);
      setPromoResult(null);
    } finally {
      setApplying(false);
    }
  }

  async function onSubmit(vals: FormValues): Promise<void> {
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
      const response = await fetch("/api/register", {
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

      const text = await response.text();
      let jsonData: unknown = null;
      try { 
        jsonData = JSON.parse(text); 
      } catch { 
        jsonData = null; 
      }

      const json = jsonData as Record<string, unknown> | null;

      if (!response.ok) {
        const message = (json?.message as string) ?? (json?.error as string) ?? `Register failed (${response.status})`;
        toast.error(message);
        return;
      }

      toast.success("Registered successfully" + (usedFinal === 0 ? " — marked as paid" : ""));
      reset();
      setPromoResult(null);
      router.push(`/course/${course.slug ?? course._id}/thank-you`);
    } catch (error: unknown) {
      console.error("register error:", error);
      toast.error("Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="w-full">
      <div className="flex flex-col xl:flex-row gap-6 lg:gap-8">
        
        {/* Course Preview - Left on desktop, top on mobile */}
        <aside className="w-full xl:w-7/12 order-2 xl:order-1">
          <div className="bg-white rounded-2xl border border-indigo-100 shadow-lg overflow-hidden">
            
            {/* Course Image */}
            <div className="w-full h-48 sm:h-64 lg:h-80 bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center relative">
              {course.image ? (
                <Image 
                  src={course.image} 
                  alt={course.title} 
                  fill
                  className="object-cover" 
                  priority
                  sizes="(max-width: 1280px) 100vw, 58vw"
                />
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">📚</span>
                  </div>
                  <span className="text-indigo-400 font-medium">Course Preview</span>
                </div>
              )}
            </div>

            {/* Course Details */}
            <div className="p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-3">
                {course.title}
              </h2>
              
              {course.description && (
                <p className="text-sm sm:text-base text-gray-600 mb-6 leading-relaxed">
                  {course.description}
                </p>
              )}

              {/* Course Meta Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="text-center sm:text-left">
                  <div className="text-xs text-gray-500 font-medium mb-1">Date</div>
                  <div className="text-sm sm:text-base font-semibold text-gray-800">Coming Soon</div>
                </div>
                <div className="text-center sm:text-left">
                  <div className="text-xs text-gray-500 font-medium mb-1">Time</div>
                  <div className="text-sm sm:text-base font-semibold text-gray-800">7 PM IST</div>
                </div>
                <div className="text-center sm:text-left">
                  <div className="text-xs text-gray-500 font-medium mb-1">Duration</div>
                  <div className="text-sm sm:text-base font-semibold text-gray-800">
                    {course.duration ?? "Self-paced"}
                  </div>
                </div>
              </div>

              {/* Price and Instructor */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-6 border-t border-indigo-100">
                
                {/* Price */}
                <div>
                  <div className="text-xs text-gray-500 font-medium mb-1">Price</div>
                  <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    {Number(course.price ?? 0) === 0 ? "Free" : `₹${Number(course.price ?? 0).toLocaleString("en-IN")}`}
                  </div>
                </div>

                {/* Instructor */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100 ring-2 ring-indigo-200 relative flex-shrink-0">
                    {course.mentor?.image ? (
                      <Image 
                        src={course.mentor.image} 
                        alt={course.mentor.name ?? "Instructor"} 
                        fill
                        className="object-cover" 
                        sizes="56px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm font-bold bg-gradient-to-br from-indigo-400 to-purple-500 text-white">
                        {(course.mentor?.name ?? "I").slice(0, 1).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                      {course.mentor?.name ?? "Expert Instructor"}
                    </div>
                    <div className="text-xs sm:text-sm text-indigo-600 truncate">
                      {course.mentor?.role ?? "Lead Instructor"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Course Details Link */}
              <div className="mt-6 pt-6 border-t border-indigo-100">
                <a 
                  href={`/course/${course.slug ?? course._id}`} 
                  className="inline-flex items-center gap-2 px-4 py-2 border-2 border-indigo-200 rounded-xl text-sm font-medium text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  View course details
                </a>
              </div>
            </div>
          </div>
        </aside>

        {/* Registration Form - Right on desktop, bottom on mobile */}
        <main className="w-full xl:w-5/12 order-1 xl:order-2">
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-indigo-100 shadow-lg">
            
            {/* Form Header */}
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                <div>
                  <div className="text-xs text-gray-500 font-medium">Registering For</div>
                  <div className="font-bold text-gray-900 text-sm sm:text-base truncate">
                    {course.title}
                  </div>
                </div>
                <div className="text-xs sm:text-sm text-gray-700 bg-indigo-50 px-3 py-1 rounded-full">
                  Batch: <strong>Batch 1</strong>
                </div>
              </div>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              
              {/* Name Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input 
                  {...register("name", { required: true })} 
                  className="w-full border-2 border-indigo-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200" 
                  placeholder="Enter your full name" 
                />
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input 
                  {...register("email", { required: true })} 
                  type="email" 
                  className="w-full border-2 border-indigo-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200" 
                  placeholder="you@example.com" 
                />
              </div>

              {/* Country and Phone Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Country</label>
                  <select 
                    {...register("country")} 
                    className="w-full border-2 border-indigo-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                  >
                    <option value="IN">India: +91</option>
                    <option value="US">United States: +1</option>
                    <option value="UK">United Kingdom: +44</option>
                    <option value="CA">Canada: +1</option>
                    <option value="AU">Australia: +61</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Phone Number</label>
                  <input 
                    {...register("phone")} 
                    className="w-full border-2 border-indigo-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200" 
                    placeholder="Mobile number" 
                  />
                </div>
              </div>

              {/* Graduation Year */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Graduation Year</label>
                <input 
                  {...register("graduationYear")} 
                  className="w-full border-2 border-indigo-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200" 
                  placeholder="2027" 
                />
              </div>

              {/* Course Price */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Course Price (₹)</label>
                <input 
                  {...register("price", { valueAsNumber: true })} 
                  type="number" 
                  className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-sm bg-gray-100 cursor-not-allowed" 
                  disabled 
                />
              </div>

              {/* Promo Code */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Promo Code (optional)</label>
                <div className="flex gap-3">
                  <input 
                    {...register("promo")} 
                    className="flex-1 border-2 border-indigo-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200" 
                    placeholder="Enter promo code" 
                  />
                  <button
                    type="button"
                    onClick={() => applyPromo(watchedPromo)}
                    disabled={applying || !(watchedPromo ?? "").trim()}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 rounded-xl disabled:opacity-60 hover:from-indigo-200 hover:to-purple-200 transition-all duration-200 font-medium whitespace-nowrap"
                  >
                    {applying ? "Applying..." : promoResult ? "Applied" : "Apply"}
                  </button>
                </div>

                {promoResult && (
                  <div className="mt-3 p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-semibold text-green-800">Promo Code Applied!</span>
                    </div>
                    <p className="text-sm text-green-700">
                      <strong>{promoResult.code}</strong> — Discount: ₹{promoResult.discountAmount} — Final: ₹{promoResult.finalAmount}
                    </p>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Additional Notes</label>
                <textarea 
                  {...register("notes")} 
                  className="w-full border-2 border-indigo-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200" 
                  rows={3} 
                  placeholder="Any questions or special requirements?" 
                />
              </div>

              {/* Final Amount and Submit */}
              <div className="pt-6 border-t border-indigo-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <div className="text-xs text-gray-500 font-medium mb-1">Amount to Pay</div>
                    <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      ₹{Number(finalAmount).toLocaleString("en-IN")}
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 hover:from-indigo-700 hover:via-purple-700 hover:to-blue-700 text-white rounded-xl font-bold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </div>
                    ) : (
                      finalAmount > 0 
                        ? `Proceed to Pay ₹${Number(finalAmount).toLocaleString("en-IN")}` 
                        : "Complete Registration"
                    )}
                  </button>
                </div>
              </div>
            </form>

            {/* Security Notice */}
            <div className="mt-6 pt-6 border-t border-indigo-100">
              <div className="flex items-center gap-3 text-xs text-gray-600">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Your information is secure and encrypted. We never share your personal details.</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </section>
  );
}