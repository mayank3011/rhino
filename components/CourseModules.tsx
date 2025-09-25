// components/CourseModules.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Topic = { text?: string };
type ModuleType = { title?: string; topics?: Topic[] };

export default function CourseModules({
  modules = [],
  accentColor = "#5b2bff",
}: {
  modules: ModuleType[];
  accentColor?: string;
}) {
  const [open, setOpen] = useState<Record<number, boolean>>({});
  const [expandedAll, setExpandedAll] = useState(false);

  // initialize open map (closed by default)
  useEffect(() => {
    const initial: Record<number, boolean> = {};
    modules.forEach((_: any, i: number) => initial[i] = false);
    setOpen(initial);
  }, [modules]);

  // Expand all toggle
  useEffect(() => {
    if (expandedAll) {
      const m: Record<number, boolean> = {};
      modules.forEach((_: any, i: number) => m[i] = true);
      setOpen(m);
    } else {
      const m: Record<number, boolean> = {};
      modules.forEach((_: any, i: number) => m[i] = false);
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Course content</h3>
          <div className="text-sm text-slate-500">Modules & topics (ordered)</div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpandedAll((v) => !v)}
            className="text-sm px-3 py-1 border rounded"
            style={{ borderColor: accentColor, color: accentColor }}
          >
            {expandedAll ? "Collapse all" : "Expand all"}
          </button>
          <div className="text-xs text-slate-500">{anyOpen ? "Some open" : "All closed"}</div>
        </div>
      </div>

      <div className="space-y-3">
        {modules.map((m: ModuleType, i: number) => (
          <div key={i} id={`module-${i}`} className="border rounded">
            <button
              onClick={() => toggle(i)}
              className="w-full flex items-center justify-between p-3"
              aria-expanded={Boolean(open[i])}
            >
              <div className="text-left">
                <div className="font-medium" style={{ color: accentColor }}>{m.title || `Module ${i + 1}`}</div>
                <div className="text-xs text-slate-500 mt-0.5">{(m.topics || []).length} topics</div>
              </div>
              <div className="ml-4 text-slate-500">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M6 9l6 6 6-6" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" transform={open[i] ? "rotate(180 12 12)" : ""} />
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
                  className="overflow-hidden"
                >
                  <div className="p-4 pt-0">
                    <ol className="list-decimal pl-5 space-y-2 text-slate-700">
                      {(m.topics || []).map((t: any, ti: number) => (
                        <li key={ti} className="py-1">
                          <div className="text-sm">{t.text ?? "Topic"}</div>
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
