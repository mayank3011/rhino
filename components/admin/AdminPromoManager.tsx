// components/admin/AdminPromoManager.tsx
"use client";

import React from "react";
import useSWR, { mutate } from "swr";
import fetcher from "../../utils/fetcher";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

type PromoForm = {
  code: string;
  discountType: "percent" | "flat" | "fixed";
  amount: number;
  expiresAt?: string | null;
  active?: boolean;
};

export default function AdminPromoManager() {
  const { data, error } = useSWR("/api/admin/promocodes", fetcher);
  const { register, handleSubmit, reset, setError } = useForm<PromoForm>({
    defaultValues: { discountType: "percent", amount: 10, active: true },
  });

  async function onCreate(vals: any) {
    try {
      const payload = {
        code: String(vals.code ?? "").trim().toUpperCase(),
        discountType: vals.discountType,
        amount: Number(vals.amount ?? 0),
        expiresAt: vals.expiresAt ? vals.expiresAt : null,
        active: !!vals.active,
      };

      const res = await fetch("/api/admin/promocodes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 422 && json?.issues) {
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
      mutate("/api/admin/promocodes");
    } catch (err: any) {
      console.error("create promo error:", err);
      toast.error(err?.message || "Create failed");
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Delete promo code?")) return;
    const key = "/api/admin/promocodes";
    const current = data ?? [];
    mutate(key, current.filter((p: any) => p._id !== id), false);
    try {
      const res = await fetch(`/api/admin/promocodes/${id}`, { method: "DELETE" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "Delete failed");
      toast.success("Deleted");
      mutate(key);
    } catch (err: any) {
      console.error("delete promo error:", err);
      toast.error(err?.message || "Delete failed");
      mutate(key);
    }
  }

  function fmtAmount(p: any) {
    if (!p) return "";
    const amt = Number(p.amount ?? 0);
    if (p.discountType === "percent") return `${amt}%`;
    // 'flat' and 'fixed' both shown as currency; difference in semantics can be handled server-side
    return `₹${Number(amt).toLocaleString("en-IN")}`;
  }

  if (error) return <div className="text-red-600">Failed to load promo codes</div>;

  return (
    <div>
      <form onSubmit={handleSubmit(onCreate)} className="bg-white p-3 rounded mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <input {...register("code", { required: "Code required" })} placeholder="CODE" className="p-2 border rounded" />
          <select {...register("discountType")} className="p-2 border rounded">
            <option value="percent">Percent (%)</option>
            <option value="flat">Flat (₹)</option>
            <option value="fixed">Fixed (₹)</option>
          </select>

          <input {...register("amount", { valueAsNumber: true, required: "Amount required" })} type="number" placeholder="Amount" className="p-2 border rounded" />
          <input {...register("expiresAt")} type="datetime-local" className="p-2 border rounded" />
          <label className="flex items-center gap-2 md:col-span-1">
            <input type="checkbox" {...register("active")} defaultChecked />
            Active
          </label>

          <div className="md:col-span-4">
            <button type="submit" className="px-3 py-2 bg-indigo-600 text-white rounded">Create Promo</button>
          </div>
        </div>
      </form>

      <div className="space-y-2">
        {(data ?? []).length === 0 ? (
          <div className="p-3 text-sm text-slate-600">No promo codes yet.</div>
        ) : (
          (data ?? []).map((p: any) => (
            <div key={p._id} className="flex items-center justify-between p-2 border rounded bg-white">
              <div>
                <div className="font-medium">{p.code}</div>
                <div className="text-sm text-slate-500">
                  {p.discountType} — {fmtAmount(p)}
                  {p.expiresAt ? ` · Expires: ${new Date(p.expiresAt).toLocaleString()}` : ""}
                  {p.active === false ? " · inactive" : ""}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => onDelete(p._id)} className="px-3 py-1 bg-red-500 text-white rounded">Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
