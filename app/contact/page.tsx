// app/contact/page.tsx
"use client";
import React, { useState } from "react";
import toast from "react-hot-toast";

// --- Constants based on Logo Colors ---
const COLOR_PRIMARY = "indigo-600";
const COLOR_SECONDARY = "violet-700";
const COLOR_HOVER = "indigo-700";

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
      const j: { error?: string; message?: string } = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || j?.message || "Send failed");
      toast.success("Message sent — we will get back to you soon!");
      setName(""); setEmail(""); setMessage("");
    } catch (err: unknown) {
      // FIXED: Replaced 'any' with 'unknown' in catch block
      const errorMessage = err instanceof Error ? err.message : "Send failed";
      console.error("contact error", err);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className={`text-3xl font-bold mb-4 text-${COLOR_SECONDARY}`}>Get in Touch</h1>
      <p className="text-base text-slate-600 mb-8">
        Have questions, a partnership idea, or need support? Send us a message, and we&apos;ll reply within 1 business day.
      </p>

      <form onSubmit={onSubmit} className="bg-white rounded-xl p-8 shadow-2xl border border-slate-100 space-y-6">
        <div>
          <label className="text-sm font-medium text-slate-700">Your Name</label>
          <input 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required 
            className="mt-2 w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:border-indigo-500 focus:ring-indigo-500" 
            placeholder="Jane Doe"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Your Email</label>
          <input 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            type="email" 
            className="mt-2 w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:border-indigo-500 focus:ring-indigo-500" 
            placeholder="jane@example.com"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Your Message</label>
          <textarea 
            value={message} 
            onChange={(e) => setMessage(e.target.value)} 
            required 
            rows={6} 
            className="mt-2 w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:border-indigo-500 focus:ring-indigo-500 resize-none"
            placeholder="Type your message here..."
          />
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <button 
            type="submit" 
            disabled={submitting} 
            className={`px-6 py-3 rounded-xl text-white font-semibold text-lg transition-colors w-full sm:w-auto ${submitting ? "bg-gray-400 cursor-not-allowed" : `bg-${COLOR_PRIMARY} hover:bg-${COLOR_HOVER}`}`}
          >
            {submitting ? "Sending..." : "Send Message"}
          </button>
          <div className="text-sm text-slate-500">
            Or email us directly at <a className={`text-${COLOR_PRIMARY} font-medium hover:underline`} href="mailto:hello@rhinogeeks.com">hello@rhinogeeks.com</a>
          </div>
        </div>
      </form>
    </main>
  );
}