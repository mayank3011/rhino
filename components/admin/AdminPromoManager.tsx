"use client";

import React from "react";
import useSWR, { mutate } from "swr";
import fetcher from "../../utils/fetcher";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

type PromoForm = {
  code: string;
  discountType: "percent" | "fixed";
  amount: number;
  expiresAt?: string | null; // datetime-local string or empty
  active?: boolean;
};

export default function AdminPromoManager() {
  const { data, error } = useSWR("/api/admin/promocodes", fetcher);
  const { register, handleSubmit, reset, setError, formState } = useForm<PromoForm>({
    defaultValues: { discountType: "percent", amount: 10, active: true },
  });

  async function onCreate(vals: any) {
    try {
      const payload = {
        ...vals,
        // normalize empty expiresAt to null
        expiresAt: vals.expiresAt ? vals.expiresAt : null,
      };
      const res = await fetch("/api/admin/promocodes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 422 && json?.issues) {
          // map issues to form errors
          for (const key of Object.keys(json.issues)) {
            const msg = json.issues[key]?.[0] ?? "Invalid";
            if (key === "_error") toast.error(msg);
            else setError(key as any, { type: "server", message: msg });
          }
          toast.error("Validation errors — check fields");
          return;
        }
        throw new Error(json?.error || "Create failed");
      }

      toast.success("Promo created");
      reset();
      mutate("/api/admin/promocodes"); // revalidate
    } catch (err: any) {
      toast.error(err.message || "Create failed");
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Delete promo code?")) return;
    const key = "/api/admin/promocodes";
    const current = data ?? [];
    // optimistic update
    mutate(key, current.filter((p:any) => p._id !== id), false);
    try {
      const res = await fetch(`/api/admin/promocodes/${id}`, { method: "DELETE" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "Delete failed");
      toast.success("Deleted");
      mutate(key);
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
      mutate(key); // revert by revalidating
    }
  }

  if (error) return <div className="text-red-600">Failed to load promo codes</div>;

  return (
    <div>
      <form onSubmit={handleSubmit(onCreate)} className="bg-white p-3 rounded mb-4">
        <div className="grid grid-cols-2 gap-2">
          <input {...register("code", { required: "Code required" })} placeholder="CODE" className="p-2 border" />
          <select {...register("discountType")} className="p-2 border">
            <option value="percent">Percent (%)</option>
            <option value="fixed">Fixed (₹)</option>
          </select>

          <input {...register("amount", { valueAsNumber: true, required: "Amount required" })} type="number" placeholder="Amount" className="p-2 border" />
          <input {...register("expiresAt")} type="datetime-local" className="p-2 border" />

          <label className="flex items-center gap-2">
            <input type="checkbox" {...register("active")} defaultChecked />
            Active
          </label>

          <div>
            <button type="submit" className="btn-primary">Create Promo</button>
          </div>
        </div>
      </form>

      <div className="space-y-2">
        {(data ?? []).map((p:any) => (
          <div key={p._id} className="flex items-center justify-between p-2 border rounded">
            <div>
              <div className="font-medium">{p.code}</div>
              <div className="text-sm text-slate-500">
                {p.discountType} — {p.amount}{p.discountType === "percent" ? "%" : "₹"}
                {p.expiresAt ? ` · Expires: ${new Date(p.expiresAt).toLocaleString()}` : ""}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => onDelete(p._id)} className="px-3 py-1 bg-red-500 text-white rounded">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
