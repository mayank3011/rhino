// components/PolicyLayout.tsx
import React from "react";
import Link from "next/link";

export type TocItem = { id: string; title: string };

export default function PolicyLayout({
  title,
  intro,
  toc = [],
  children,
}: {
  title: string;
  intro?: React.ReactNode;
  toc?: TocItem[];
  children: React.ReactNode;
}) {
  // Note: This is a Server Component by default (no "use client")
  // so it's fast & SEO-friendly. It renders client-side Accordions below.
  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <header className="mb-8">
          <div
            aria-hidden
            className="inline-block px-4 py-2 rounded-lg text-white font-semibold"
            style={{ background: "linear-gradient(135deg,#4f3dff 0%,#3aa2ff 100%)" }}
          >
            {title}
          </div>

          <h1 className="mt-6 text-3xl sm:text-4xl font-extrabold tracking-tight">{title}</h1>
          {intro ? <p className="mt-3 text-slate-600 max-w-3xl">{intro}</p> : null}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* TOC (sticky on large screens) */}
          <aside className="lg:col-span-3">
            <nav className="sticky top-24 hidden lg:block">
              <div className="bg-white border rounded-lg p-4 shadow-sm">
                <div className="text-xs font-medium text-slate-500 mb-3">On this page</div>
                <ul className="space-y-2 text-sm">
                  {toc.map((t) => (
                    <li key={t.id}>
                      <a className="text-slate-700 hover:text-indigo-600" href={`#${t.id}`}>
                        {t.title}
                      </a>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 text-xs text-slate-400">
                  Need help? <Link href="/contact" className="text-indigo-600">Contact us</Link>
                </div>
              </div>
            </nav>

            {/* mobile quick links */}
            <div className="lg:hidden mb-4">
              <div className="bg-white border rounded-lg p-3 text-sm text-slate-700">
                Quick links:
                <div className="mt-2 flex flex-wrap gap-2">
                  {toc.slice(0, 4).map((t) => (
                    <a key={t.id} className="text-indigo-600 underline text-sm" href={`#${t.id}`}>
                      {t.title}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Content area */}
          <section className="lg:col-span-9 space-y-6">{children}</section>
        </div>
      </div>
    </main>
  );
}
