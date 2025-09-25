// app/profile/page.tsx

"use client";

import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Image from "next/image"; // Import Next.js Image component

// --- Constants based on Logo Colors ---
const COLOR_PRIMARY = "indigo-600";
const COLOR_HOVER = "indigo-700";

type User = { name?: string; email?: string; roles?: string[]; avatar?: string };

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch user profile on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          setUser(null);
          return;
        }
        const d = await res.json();
        const u: User | null = d?.user ?? d ?? null; // Safely assign or null
        if (!mounted) return;
        setUser(u);
        setName(u?.name ?? "");
      } catch (
        _err // 1. Fixed unused variable warning by using underscore prefix

      ) {
        setUser(null);
        console.error("profile fetch", _err);
        toast.error("Failed to load profile data");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/profile/update", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const j: { error?: string; message?: string } = await res.json().catch(() => ({}));
      
      if (!res.ok) {
        throw new Error(j?.error || j?.message || "Update failed");
      }
      
      toast.success("Profile updated successfully");
      // Update local user state immediately
      setUser((u) => ({ ...(u || {}), name }));
    } catch (err) {
      // 2. Fixed 'any' in catch block
      const message = err instanceof Error ? err.message : "Update failed";
      console.error("profile update", err);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  // --- Conditional Rendering ---
  if (loading) return <div className="container mx-auto p-6 text-center text-lg text-slate-500">Loading profile data...</div>;
  if (!user)
    return (
      <div className="container mx-auto p-6 text-center text-lg">
        Please{" "}
        <a href="/login" className={`text-${COLOR_PRIMARY} font-medium hover:underline`}>
          login
        </a>{" "}
        to view your profile.
      </div>
    );

  // --- Main Render ---
  return (
    <main className="container mx-auto px-4 py-12 max-w-xl">
      <h1 className={`text-3xl font-bold mb-6 text-${COLOR_PRIMARY}`}>Your Profile</h1>
      
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xl">
        {/* User Info Header */}
        <div className="flex items-center gap-6 border-b border-slate-100 pb-5">
          <div className="w-16 h-16 rounded-full bg-slate-100 overflow-hidden flex-shrink-0">
            {/* 3. Replaced <img> with Next.js <Image /> */}
            {user.avatar ? (
              <Image src={user.avatar} alt={user.name || "User Avatar"} width={64} height={64} className="w-full h-full object-cover" />
            ) : (
              <div className={`flex items-center justify-center h-full text-2xl font-bold text-white bg-${COLOR_PRIMARY}`}>
                {(user.name || user.email || "?").slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <div className="text-xl font-semibold text-gray-900">{user.name ?? "User"}</div>
            <div className="text-base text-slate-500">{user.email}</div>
            <div className="text-sm text-slate-500 mt-1">
              Roles: **{Array.isArray(user.roles) && user.roles.length > 0 ? user.roles.join(", ") : "Member"}**
            </div>
          </div>
        </div>

        {/* Update Form */}
        <form onSubmit={onSave} className="mt-8 space-y-6">
          <h2 className="text-xl font-semibold text-gray-800">Account Details</h2>
          
          <div>
            <label className="block text-sm font-medium text-slate-700">Full name</label>
            <input 
              className="mt-2 w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:border-indigo-500 focus:ring-indigo-500" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Enter your full name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700">Email Address (Read Only)</label>
            <input 
              className="mt-2 w-full border border-slate-200 rounded-lg px-4 py-2.5 bg-slate-50 text-slate-500 cursor-not-allowed" 
              value={user.email || ""} 
              disabled 
            />
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button 
              type="submit" 
              disabled={submitting} 
              className={`px-6 py-2.5 rounded-lg text-white font-medium transition-colors ${submitting ? "bg-gray-400 cursor-not-allowed" : `bg-${COLOR_PRIMARY} hover:bg-${COLOR_HOVER}`}`}
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>
            <button 
              type="button" 
              onClick={() => { setName(user?.name ?? ""); toast("Changes discarded"); }} 
              className="px-4 py-2.5 border border-slate-300 rounded-lg text-gray-700 font-medium hover:bg-slate-50 transition-colors"
            >
              Reset
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}