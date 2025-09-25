// app/profile/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

type User = { name?: string; email?: string; roles?: string[]; avatar?: string };

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          setUser(null); return;
        }
        const d = await res.json();
        const u = d?.user ?? d ?? null;
        if (!mounted) return;
        setUser(u);
        setName(u?.name ?? "");
      } catch (err) {
        setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
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
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "Update failed");
      toast.success("Profile updated");
      setUser(u => ({ ...(u||{}), name }));
    } catch (err: any) {
      console.error("profile update", err);
      toast.error(err?.message || "Update failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="container mx-auto p-6">Loading...</div>;
  if (!user) return <div className="container mx-auto p-6">Please <a href="/login" className="text-indigo-600">login</a>.</div>;

  return (
    <main className="container mx-auto px-4 py-10 max-w-2xl">
      <div className="bg-white border rounded-lg p-6 shadow">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 overflow-hidden">
            {user.avatar ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-slate-600">{(user.name||user.email||"?").slice(0,1)}</div>}
          </div>
          <div>
            <div className="text-lg font-semibold">{user.name ?? user.email}</div>
            <div className="text-sm text-slate-500">{Array.isArray(user.roles) ? user.roles.join(", ") : ""}</div>
          </div>
        </div>

        <form onSubmit={onSave} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium">Full name</label>
            <input className="mt-1 w-full border rounded px-3 py-2" value={name} onChange={(e)=>setName(e.target.value)} />
          </div>

          <div className="flex items-center gap-3">
            <button type="submit" disabled={submitting} className={`px-4 py-2 rounded text-white ${submitting ? "bg-gray-400" : "bg-indigo-600 hover:bg-indigo-700"}`}>
              {submitting ? "Saving..." : "Save changes"}
            </button>
            <button type="button" onClick={() => { setName(user?.name ?? ""); toast("Changes discarded"); }} className="px-3 py-2 border rounded">Reset</button>
          </div>
        </form>
      </div>
    </main>
  );
}
