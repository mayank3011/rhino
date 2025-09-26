"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";

type Item = { q: string; a: string };

export default function FAQ({ items }: { items: Item[] }) {
  const [open, setOpen] = React.useState<number | null>(0);

  return (
    <div className="mt-8 space-y-3">
      {items.map((it, idx) => {
        const isOpen = open === idx;
        return (
          <div
            key={it.q}
            className="rounded-2xl border border-slate-200 bg-white overflow-hidden"
          >
            <button
              onClick={() => setOpen(isOpen ? null : idx)}
              className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <span className="font-semibold text-slate-900">{it.q}</span>
              <span
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full border ${
                  isOpen
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "text-slate-500 border-slate-300"
                }`}
                aria-hidden
              >
                {isOpen ? "−" : "+"}
              </span>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: "easeInOut" }}
                >
                  <div className="px-5 pb-5 text-sm leading-relaxed text-slate-700">
                    {it.a}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
