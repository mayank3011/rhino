// app/contact/page.tsx
"use client";
import React, { useState } from "react";
import toast from "react-hot-toast";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "Send failed");
      toast.success("Message sent — we will get back to you");
      setName(""); setEmail(""); setMessage("");
    } catch (err: any) {
      console.error("contact error", err);
      toast.error(err?.message || "Send failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-2xl font-bold mb-4">Contact us</h1>
      <p className="text-slate-600 mb-6">Questions, partnerships or support — send us a message and we’ll reply within 1 business day.</p>

      <form onSubmit={onSubmit} className="bg-white rounded-lg p-6 shadow border space-y-4">
        <div>
          <label className="text-sm font-medium">Name</label>
          <input value={name} onChange={(e)=>setName(e.target.value)} required className="mt-1 w-full border rounded px-3 py-2" />
        </div>

        <div>
          <label className="text-sm font-medium">Email</label>
          <input value={email} onChange={(e)=>setEmail(e.target.value)} required type="email" className="mt-1 w-full border rounded px-3 py-2" />
        </div>

        <div>
          <label className="text-sm font-medium">Message</label>
          <textarea value={message} onChange={(e)=>setMessage(e.target.value)} required rows={6} className="mt-1 w-full border rounded px-3 py-2" />
        </div>

        <div className="flex items-center justify-between">
          <button type="submit" disabled={submitting} className={`px-4 py-2 rounded text-white ${submitting ? "bg-gray-400" : "bg-indigo-600 hover:bg-indigo-700"}`}>
            {submitting ? "Sending..." : "Send message"}
          </button>
          <div className="text-sm text-slate-500">Or email us at <a className="text-indigo-600" href="mailto:hello@rhinogeeks.com">hello@rhinogeeks.com</a></div>
        </div>
      </form>
    </main>
  );
}
