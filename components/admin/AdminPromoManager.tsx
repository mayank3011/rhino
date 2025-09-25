// components/admin/AdminPromoManager.tsx
"use client";

import React, { JSX } from "react";
import useSWR, { mutate } from "swr";
import fetcher from "../../utils/fetcher";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

// Types for better type safety
interface PromoCode {
  _id: string;
  code: string;
  discountType: "percent" | "flat" | "fixed";
  amount: number;
  expiresAt?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PromoForm {
  code: string;
  discountType: "percent" | "flat" | "fixed";
  amount: number;
  expiresAt?: string | null;
  active?: boolean;
}

interface ApiError {
  error?: string;
  issues?: Record<string, string[]>;
}



export default function AdminPromoManager(): JSX.Element {
  const { data, error } = useSWR<PromoCode[]>("/api/admin/promocodes", fetcher);
  const { register, handleSubmit, reset, setError } = useForm<PromoForm>({
    defaultValues: { discountType: "percent", amount: 10, active: true },
  });

  async function onCreate(vals: PromoForm): Promise<void> {
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
      const json: ApiError = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 422 && json?.issues) {
          for (const key of Object.keys(json.issues)) {
            const msg = json.issues[key]?.[0] ?? "Invalid";
            if (key === "_error") {
              toast.error(msg);
            } else {
              setError(key as keyof PromoForm, { type: "server", message: msg });
            }
          }
          toast.error("Validation errors — check fields");
          return;
        }
        throw new Error(json?.error || "Create failed");
      }

      toast.success("Promo created successfully");
      reset();
      mutate("/api/admin/promocodes");
    } catch (error) {
      console.error("create promo error:", error);
      const err = error as Error;
      toast.error(err?.message || "Create failed");
    }
  }

  async function onDelete(id: string): Promise<void> {
    if (!confirm("Are you sure you want to delete this promo code?")) return;
    
    const key = "/api/admin/promocodes";
    const current = data ?? [];
    
    // Optimistic update
    mutate(key, current.filter((p) => p._id !== id), false);
    
    try {
      const res = await fetch(`/api/admin/promocodes/${id}`, { method: "DELETE" });
      const json: ApiError = await res.json().catch(() => ({}));
      
      if (!res.ok) throw new Error(json?.error || "Delete failed");
      
      toast.success("Promo code deleted");
      mutate(key);
    } catch (error) {
      console.error("delete promo error:", error);
      const err = error as Error;
      toast.error(err?.message || "Delete failed");
      mutate(key); // Revert optimistic update
    }
  }

  function formatAmount(promo: PromoCode): string {
    if (!promo) return "";
    const amt = Number(promo.amount ?? 0);
    if (promo.discountType === "percent") return `${amt}%`;
    return `₹${Number(amt).toLocaleString("en-IN")}`;
  }

  function formatDiscountType(type: string): string {
    switch (type) {
      case "percent": return "Percentage";
      case "flat": return "Flat Discount";
      case "fixed": return "Fixed Price";
      default: return type;
    }
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
        <div className="text-red-600 font-medium">Failed to load promo codes</div>
        <p className="text-red-500 text-sm mt-1">Please try refreshing the page</p>
      </div>
    );
  }

  const promoCodes = data ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg border border-purple-100 p-6">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Promo Code Management
          </h1>
          <p className="text-gray-600 mt-2">Create and manage discount codes for your courses</p>
        </div>

        {/* Create Form */}
        <div className="bg-white rounded-xl shadow-lg border border-purple-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Create New Promo Code</h2>
          
          <form onSubmit={handleSubmit(onCreate)} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Code Input */}
              <div className="lg:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Promo Code
                </label>
                <input 
                  {...register("code", { required: "Code required" })} 
                  placeholder="e.g., SAVE20" 
                  className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 uppercase"
                />
              </div>

              {/* Discount Type */}
              <div className="lg:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Type
                </label>
                <select 
                  {...register("discountType")} 
                  className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                >
                  <option value="percent">Percentage (%)</option>
                  <option value="flat">Flat Discount (₹)</option>
                  <option value="fixed">Fixed Price (₹)</option>
                </select>
              </div>

              {/* Amount */}
              <div className="lg:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount
                </label>
                <input 
                  {...register("amount", { valueAsNumber: true, required: "Amount required", min: 0 })} 
                  type="number" 
                  placeholder="10" 
                  className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                />
              </div>

              {/* Expiry Date */}
              <div className="lg:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expires At (Optional)
                </label>
                <input 
                  {...register("expiresAt")} 
                  type="datetime-local" 
                  className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                />
              </div>
            </div>

            {/* Active Checkbox */}
            <div className="flex items-center gap-3">
              <input 
                type="checkbox" 
                {...register("active")} 
                defaultChecked 
                className="w-5 h-5 text-purple-600 border-2 border-purple-200 rounded focus:ring-purple-500"
              />
              <label className="text-sm font-medium text-gray-700">
                Active (users can use this code)
              </label>
            </div>

            {/* Submit Button */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                type="submit" 
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
              >
                Create Promo Code
              </button>
              <button 
                type="button"
                onClick={() => reset()}
                className="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium"
              >
                Reset Form
              </button>
            </div>
          </form>
        </div>

        {/* Promo Codes List */}
        <div className="bg-white rounded-xl shadow-lg border border-purple-100 p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Active Promo Codes</h2>
              <p className="text-gray-600 text-sm mt-1">
                {promoCodes.length} {promoCodes.length === 1 ? 'code' : 'codes'} total
              </p>
            </div>
            <button 
              onClick={() => mutate("/api/admin/promocodes")}
              className="px-4 py-2 border-2 border-purple-200 text-purple-700 rounded-lg hover:bg-purple-50 transition-all duration-200 font-medium"
            >
              Refresh
            </button>
          </div>

          <div className="space-y-3">
            {promoCodes.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🎟️</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No promo codes yet</h3>
                <p className="text-gray-600">Create your first promo code to get started</p>
              </div>
            ) : (
              promoCodes.map((promo) => (
                <div 
                  key={promo._id} 
                  className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-4 border border-purple-100 rounded-xl hover:shadow-md transition-all duration-200 bg-gradient-to-r from-purple-50/50 to-blue-50/50"
                >
                  <div className="flex-1 min-w-0 mb-3 lg:mb-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                      <div className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-full font-mono font-bold text-sm">
                        {promo.code}
                      </div>
                      {!promo.active && (
                        <div className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                          Inactive
                        </div>
                      )}
                    </div>

                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex flex-wrap items-center gap-4">
                        <span>
                          <span className="font-medium text-gray-700">Type:</span> {formatDiscountType(promo.discountType)}
                        </span>
                        <span>
                          <span className="font-medium text-gray-700">Discount:</span> 
                          <span className="font-semibold text-green-600 ml-1">{formatAmount(promo)}</span>
                        </span>
                      </div>
                      
                      {promo.expiresAt && (
                        <div>
                          <span className="font-medium text-gray-700">Expires:</span> 
                          <span className="ml-1">{new Date(promo.expiresAt).toLocaleString()}</span>
                        </div>
                      )}
                      
                      <div>
                        <span className="font-medium text-gray-700">Created:</span> 
                        <span className="ml-1">{new Date(promo.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full lg:w-auto">
                    <button 
                      onClick={() => onDelete(promo._id)} 
                      className="flex-1 lg:flex-none px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}