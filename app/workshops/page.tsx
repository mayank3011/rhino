// app/workshops/page.tsx
import Link from "next/link";

export const metadata = {
  title: "Workshops | RhinoGeeks",
  description: "Short, hands-on workshops to upskill fast.",
};

export default function WorkshopsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      <section className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {/* Hero */}
        <div className="text-center">
          <span className="inline-flex items-center rounded-full bg-indigo-100 text-indigo-700 px-3 py-1 text-xs font-semibold">
            Hands-on · Live & Cohort Based
          </span>
          <h1 className="mt-4 text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            Weekend Workshops to Master One Skill at a Time
          </h1>
          <p className="mt-4 text-slate-600 max-w-2xl mx-auto">
            Bite-sized, project-driven sessions designed to give you practical,
            job-ready skills fast — without the fluff.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link
              href="/courses"
              className="inline-flex items-center rounded-lg px-5 py-2.5 bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition"
            >
              Browse All Programs
            </Link>
            <a
              href="#upcoming"
              className="inline-flex items-center rounded-lg px-5 py-2.5 border border-indigo-200 text-indigo-700 hover:bg-indigo-50 transition"
            >
              Upcoming Workshops
            </a>
          </div>
        </div>

        {/* What you get */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              h: "Live, Interactive",
              p: "Small cohorts, real-time Q&A, and practical demos.",
            },
            { h: "Project First", p: "Every workshop builds a shippable artifact." },
            { h: "Mentor Feedback", p: "Get reviewed by practitioners, not theory." },
            { h: "Lifetime Access", p: "Access recordings & resources forever." },
          ].map((f) => (
            <div
              key={f.h}
              className="rounded-xl border border-slate-200 bg-white p-5"
            >
              <h3 className="text-base font-semibold text-slate-900">{f.h}</h3>
              <p className="mt-2 text-sm text-slate-600">{f.p}</p>
            </div>
          ))}
        </div>

        {/* Upcoming */}
        <div id="upcoming" className="mt-14 space-y-6">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900">
            Upcoming Workshops
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                title: "Git & GitHub in a Day",
                date: "Sat, Nov 16 · 5 hrs",
                level: "Beginner",
                desc:
                  "Master branches, PRs, and collaboration workflows used by real teams.",
              },
              {
                title: "Deploy Fast with Vercel",
                date: "Sun, Nov 24 · 4 hrs",
                level: "Intermediate",
                desc:
                  "CI/CD basics, environment vars, previews, and production rollbacks.",
              },
              {
                title: "TypeScript Essentials",
                date: "Sat, Dec 7 · 6 hrs",
                level: "Beginner→Intermediate",
                desc:
                  "From types & generics to refactoring a real React codebase.",
              },
              {
                title: "Intro to Prompt Engineering",
                date: "Sun, Dec 15 · 4 hrs",
                level: "All levels",
                desc:
                  "Learn to design prompts and small automations for productivity.",
              },
            ].map((w) => (
              <div
                key={w.title}
                className="rounded-xl bg-white border border-slate-200 p-6 flex flex-col"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {w.title}
                  </h3>
                  <span className="text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700 px-2 py-1">
                    {w.level}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500">{w.date}</p>
                <p className="mt-3 text-sm text-slate-700">{w.desc}</p>
                <div className="mt-5">
                  <Link
                    href="/register?course=workshop"
                    className="inline-flex items-center rounded-lg px-4 py-2 bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition"
                  >
                    Reserve your seat
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-14">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900">
            Frequently Asked Questions
          </h2>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                q: "Are workshops recorded?",
                a: "Yes, recordings and resources are available for lifetime access.",
              },
              {
                q: "Do I get a certificate?",
                a: "Yes, you receive a completion certificate after each workshop.",
              },
              {
                q: "What if I’m a beginner?",
                a: "Perfect—our workshops start from fundamentals and build up quickly.",
              },
              {
                q: "What tools do I need?",
                a: "A modern browser, VS Code, and a GitHub account for most workshops.",
              },
            ].map((item) => (
              <div key={item.q} className="rounded-xl bg-white border p-5">
                <div className="font-semibold text-slate-900">{item.q}</div>
                <div className="mt-2 text-sm text-slate-600">{item.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
