// app/register/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

type FormValues = {
  name: string;
  email: string;
  phone?: string;
  course?: string; // slug or id
  promo?: string;
  price?: number;
  notes?: string;
};

export default function RegisterPage() {
  const params = useSearchParams();
  const router = useRouter();
  const courseParam = params?.get("course") ?? "";

  const { register, handleSubmit, setValue, watch, reset } = useForm<FormValues>({
    defaultValues: { name: "", email: "", phone: "", course: courseParam, promo: "", price: 0, notes: "" },
  });

  const watchedPrice = watch("price") ?? 0;
  const watchedPromo = watch("promo") ?? "";

  const [loadingCourse, setLoadingCourse] = useState(false);
  const [courseInfo, setCourseInfo] = useState<null | any>(null); // { title, description, price, slug, image... }
  const [applying, setApplying] = useState(false);
  const [promoResult, setPromoResult] = useState<null | {
    code: string;
    discountType: string;
    discountAmount: number;
    finalAmount: number;
  }>(null);

  // Fetch single course by slug or id and pre-fill price/title
  useEffect(() => {
    async function loadCourse() {
      if (!courseParam) return;
      setLoadingCourse(true);
      try {
        const res = await fetch(`/api/courses/${encodeURIComponent(courseParam)}`);
        if (!res.ok) {
          console.warn("Course fetch failed", res.status);
          setCourseInfo(null);
          setLoadingCourse(false);
          return;
        }
        const json = await res.json();
        // ensure price numeric
        const priceNum = typeof json.price === "string" ? Number(json.price) : (json.price ?? 0);
        setCourseInfo(json);
        setValue("price", Number.isFinite(priceNum) ? priceNum : 0);
        setValue("course", json.slug ?? json._id ?? courseParam);
      } catch (err) {
        console.error("loadCourse error", err);
        setCourseInfo(null);
      } finally {
        setLoadingCourse(false);
      }
    }
    loadCourse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseParam, setValue]);

  // Apply promo code
  async function applyPromo(code?: string) {
    const promoCode = (code ?? watchedPromo ?? "").trim();
    if (!promoCode) {
      toast.error("Enter a promo code to apply");
      return;
    }

    const priceNumeric = Number(watchedPrice ?? 0);
    if (!Number.isFinite(priceNumeric) || priceNumeric < 0) {
      toast.error("Invalid course price");
      return;
    }

    setApplying(true);
    try {
      const res = await fetch("/api/promocodes/apply", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: promoCode, amount: priceNumeric }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 422 && json?.issues) {
          const firstKey = Object.keys(json.issues)[0];
          const msg = json.issues[firstKey]?.[0] ?? "Validation error";
          toast.error(msg);
        } else if (json?.error) {
          const map: Record<string, string> = { invalid_code: "Promo code is invalid", expired: "Promo code expired" };
          toast.error(map[json.error] ?? json.error);
        } else {
          toast.error(`Apply failed (${res.status})`);
        }
        setPromoResult(null);
        return;
      }

      setPromoResult({
        code: json.code,
        discountType: json.discountType,
        discountAmount: Number(json.discountAmount ?? 0),
        finalAmount: Number(json.finalAmount ?? priceNumeric),
      });
      toast.success(`Promo applied — saved ₹${Number(json.discountAmount ?? 0)}`);
    } catch (err: any) {
      console.error("applyPromo error", err);
      toast.error(err?.message || "Promo apply failed");
      setPromoResult(null);
    } finally {
      setApplying(false);
    }
  }

  // If promo input changes, clear applied promoResult so user must re-apply
  useEffect(() => {
    setPromoResult((prev) => {
      if (!prev) return null;
      if ((watchedPromo ?? "").trim().toUpperCase() !== prev.code?.toUpperCase()) return null;
      return prev;
    });
  }, [watchedPromo]);

  const finalAmount = promoResult ? promoResult.finalAmount : Number(watchedPrice ?? 0);

  const onSubmit = async (vals: FormValues) => {
    const priceNumeric = Number(vals.price ?? 0);
    const applied = promoResult && promoResult.code && (vals.promo ?? "").trim().toUpperCase() === promoResult.code.toUpperCase();

    if (vals.promo && !applied) {
      await applyPromo(vals.promo);
    }

    const usedFinal = (promoResult && (vals.promo ?? "").trim().toUpperCase() === (promoResult.code ?? "").toUpperCase())
      ? promoResult.finalAmount
      : priceNumeric;

    if (usedFinal > 0) {
      const qp = new URLSearchParams({
        name: vals.name,
        email: vals.email,
        phone: vals.phone ?? "",
        course: vals.course ?? "",
        promo: vals.promo ?? "",
        amount: String(usedFinal),
      }).toString();
      router.push(`/payment?${qp}`);
      return;
    }

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: vals.name,
          email: vals.email,
          phone: vals.phone,
          course: vals.course,
          notes: vals.notes,
          promoCode: vals.promo,
          amount: usedFinal,
          paid: usedFinal === 0,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(j?.error || `Register failed (${res.status})`);
        return;
      }
      toast.success("Registered successfully" + (usedFinal === 0 ? " — marked as paid" : ""));
      reset();
      setPromoResult(null);
    } catch (err: any) {
      console.error("register error", err);
      toast.error("Registration failed");
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-lg">
      <h1 className="text-2xl font-bold mb-4">Register for a Course</h1>

      {loadingCourse ? (
        <div className="mb-4 text-sm text-slate-600">Loading course details...</div>
      ) : courseInfo ? (
        <div className="mb-4 border p-3 rounded bg-white">
          <div className="font-semibold text-lg">{courseInfo.title}</div>
          {courseInfo.description && <div className="text-sm text-slate-600 mt-2">{courseInfo.description}</div>}
        </div>
      ) : courseParam ? (
        <div className="mb-4 text-sm text-rose-600">Course not found: {courseParam}</div>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <input type="hidden" {...register("course")} />

        <div>
          <label className="block text-sm">Name</label>
          <input {...register("name", { required: true })} className="w-full p-2 border rounded" />
        </div>

        <div>
          <label className="block text-sm">Email</label>
          <input {...register("email", { required: true })} type="email" className="w-full p-2 border rounded" />
        </div>

        <div>
          <label className="block text-sm">Phone</label>
          <input {...register("phone")} className="w-full p-2 border rounded" />
        </div>

        <div>
          <label className="block text-sm">Course price (₹)</label>
          <input
            {...register("price", { valueAsNumber: true })}
            type="number"
            min={0}
            step="0.01"
            className="w-full p-2 border rounded"
            disabled={loadingCourse}
          />
          {loadingCourse && <div className="text-sm text-slate-500 mt-1">Loading course price...</div>}
        </div>

        <div>
          <label className="block text-sm">Promo code (optional)</label>
          <div className="flex gap-2">
            <input {...register("promo")} className="flex-1 p-2 border rounded" />
            <button type="button" onClick={() => applyPromo()} disabled={applying} className="px-3 py-2 bg-slate-100 rounded">
              {applying ? "Applying..." : "Apply"}
            </button>
          </div>
          {promoResult && (
            <div className="mt-2 p-2 rounded bg-green-50 text-sm">
              Promo <strong>{promoResult.code}</strong> applied — discount ₹{promoResult.discountAmount} — final ₹{promoResult.finalAmount}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm">Notes</label>
          <textarea {...register("notes")} className="w-full p-2 border rounded" rows={3} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-500">Amount to pay</div>
            <div className="text-2xl font-bold">₹{Number(finalAmount).toLocaleString("en-IN")}</div>
          </div>

          <div className="flex items-center gap-2">
            <button type="submit" className="btn-primary px-6 py-2">
              Proceed
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
