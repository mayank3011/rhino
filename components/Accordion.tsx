// components/Accordion.tsx
"use client";

import React, { useState, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Accordion({
  id,
  title,
  defaultOpen = false,
  children,
  className = "",
}: {
  id?: string;
  title: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const generatedId = useId();
  const _id = id || generatedId;
  const [open, setOpen] = useState<boolean>(defaultOpen);

  return (
    <div id={_id} className={`bg-white border rounded-lg shadow-sm overflow-hidden ${className}`}>
      <button
        onClick={() => setOpen((s) => !s)}
        aria-expanded={open}
        className="w-full text-left flex items-center justify-between px-4 py-3 focus:outline-none focus-visible:ring"
      >
        <div className="flex items-center gap-3">
          <svg
            className="w-5 h-5 text-indigo-600"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <path d="M12 5v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="font-medium text-slate-900">{title}</div>
        </div>

        <div className="text-sm text-slate-500">
          <svg
            className={`w-5 h-5 transform transition-transform ${open ? "rotate-45" : "rotate-0"}`}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
            className="px-4 pb-4"
          >
            <div className="pt-2 text-slate-700">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
