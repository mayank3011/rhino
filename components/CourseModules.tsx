// components/CourseModules.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// --- Constants based on Logo Colors for Tailwind classes ---
const COLOR_PRIMARY = "indigo-600"; 
const COLOR_SECONDARY = "violet-700";

// --- Type Definitions ---
type Topic = { text?: string };
type ModuleType = { title?: string; topics?: Topic[] };

export default function CourseModules({
  modules = [],
  // Use a sensible default hex color for dynamic styling
  accentColor = "#4f46e5", 
}: {
  modules: ModuleType[];
  accentColor?: string;
}) {
  const [open, setOpen] = useState<Record<number, boolean>>({});
  const [expandedAll, setExpandedAll] = useState(false);

  // 1. Fixed 'any' in useEffect dependency array and initial map
  // initialize open map (closed by default)
  useEffect(() => {
    const initial: Record<number, boolean> = {};
    modules.forEach((_: ModuleType, i: number) => initial[i] = false); 
    setOpen(initial);
  }, [modules]);

  // 2. Fixed 'any' in useEffect map
  // Expand all toggle
  useEffect(() => {
    if (expandedAll) {
      const m: Record<number, boolean> = {};
      modules.forEach((_: ModuleType, i: number) => m[i] = true);
      setOpen(m);
    } else {
      const m: Record<number, boolean> = {};
      modules.forEach((_: ModuleType, i: number) => m[i] = false);
      setOpen(m);
    }
  }, [expandedAll, modules]);

  // Deep-link handling: if URL has #module-X, open that module
  useEffect(() => {
    if (typeof window === "undefined") return;
    function openFromHash() {
      const h = window.location.hash;
      if (!h) return;
      const match = h.match(/^#module-(\d+)$/);
      if (match) {
        const idx = Number(match[1]);
        setOpen((s) => ({ ...s, [idx]: true }));
        // scroll into view for the module
        setTimeout(() => {
          const el = document.getElementById(`module-${idx}`);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 50);
      }
    }
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, []);

  const anyOpen = useMemo(() => Object.values(open).some(Boolean), [open]);

  function toggle(i: number) {
    setOpen((s) => ({ ...s, [i]: !s[i] }));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-4 border-slate-100">
        <div>
          <h3 className={`text-2xl font-bold text-${COLOR_SECONDARY}`}>Course Content</h3>
          <div className="text-sm text-slate-500">Structured Modules & Topics</div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setExpandedAll((v) => !v)}
            className="text-sm px-4 py-2 border rounded-lg font-medium transition-colors hover:bg-slate-50"
            // Retaining dynamic style for accent color
            style={{ borderColor: accentColor, color: accentColor }}
          >
            {expandedAll ? "Collapse All" : "Expand All"}
          </button>
          <div className="hidden sm:block text-xs text-slate-400">
            ({anyOpen ? "Some open" : "All closed"})
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* 3. Fixed 'any' in modules map argument */}
        {modules.map((m: ModuleType, i: number) => (
          <div key={i} id={`module-${i}`} className="border border-slate-200 rounded-xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
            <button
              onClick={() => toggle(i)}
              className="w-full flex items-center justify-between p-4 focus:outline-none transition-colors hover:bg-slate-50"
              aria-expanded={Boolean(open[i])}
            >
              <div className="text-left flex items-start gap-3">
                <span className={`text-lg font-extrabold text-${COLOR_PRIMARY} flex-shrink-0`}>
                  {i + 1}.
                </span>
                <div>
                    <div className="text-lg font-semibold text-gray-800">
                      {m.title || `Module ${i + 1}`}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {(m.topics || []).length} topics
                    </div>
                </div>
              </div>
              
              {/* Chevron icon with rotation */}
              <div className="ml-4 text-slate-500 flex-shrink-0 transition-transform duration-280" style={{ transform: open[i] ? "rotate(180deg)" : "rotate(0deg)" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  {/* Stroke color uses dynamic prop */}
                  <path d="M6 9l6 6 6-6" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </button>

            <AnimatePresence initial={false}>
              {open[i] && (
                <motion.div
                  key="content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: "easeInOut" }}
                  className="overflow-hidden bg-slate-50/50"
                >
                  <div className="px-4 pb-4 pt-2 border-t border-slate-100">
                    <ol className="list-decimal pl-5 space-y-2 text-slate-700">
                      {/* 4. Fixed 'any' in topics map argument */}
                      {(m.topics || []).map((t: Topic, ti: number) => (
                        <li key={ti} className="py-1">
                          <div className="text-base font-normal">{t.text ?? `Topic ${ti + 1}`}</div>
                        </li>
                      ))}
                    </ol>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}