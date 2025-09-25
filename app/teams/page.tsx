// app/teams/page.tsx
import Link from "next/link";

export const metadata = {
  title: "Upskill Your Team | RhinoGeeks",
  description:
    "Tailored training for engineering teams: modern stacks, best practices, and hands-on workshops.",
};

export default function TeamsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <section className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {/* Hero */}
        <div className="text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            Upskill Your Team with Practical Training
          </h1>
          <p className="mt-4 text-slate-600 max-w-3xl mx-auto">
            We design custom learning paths for your engineering org—mixing
            short workshops, code reviews, and real product exercises to create
            lasting capability.
          </p>
          <div className="mt-6">
            <Link
              href="#contact"
              className="inline-flex items-center rounded-lg px-5 py-2.5 bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition"
            >
              Talk to Us
            </Link>
          </div>
        </div>

        {/* Capabilities */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { h: "Modern Frontend", p: "React/Next.js, TypeScript, testing, and performance." },
            { h: "Backend & Cloud", p: "Node, APIs, caching, observability, Docker, CI/CD." },
            { h: "AI Enablement", p: "LLM basics, prompt design, retrieval, and security." },
            { h: "Architecture", p: "Microservices, monorepos, patterns, and trade-offs." },
            { h: "DX & Productivity", p: "Tooling, conventions, automation, and team rituals." },
            { h: "Leadership", p: "Mentoring, code review culture, and roadmap shaping." },
          ].map((c) => (
            <div key={c.h} className="rounded-xl bg-white border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-emerald-700">{c.h}</h3>
              <p className="mt-2 text-sm text-slate-700">{c.p}</p>
            </div>
          ))}
        </div>

        {/* Formats */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              h: "Cohort Programs",
              p: "4–8 weeks, blended live + async with projects aligned to your stack.",
            },
            { h: "Focused Workshops", p: "Half-day to 2-day intensives on one capability." },
            { h: "Advisory & Reviews", p: "Architecture, DX audits, and migration guidance." },
          ].map((f) => (
            <div key={f.h} className="rounded-2xl border border-slate-200 p-6 bg-white">
              <div className="text-sm font-semibold text-slate-500">Format</div>
              <h3 className="mt-1 text-xl font-bold text-slate-900">{f.h}</h3>
              <p className="mt-2 text-sm text-slate-700">{f.p}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div
          id="contact"
          className="mt-16 rounded-2xl border border-indigo-200 bg-indigo-50 p-6"
        >
          <h2 className="text-xl font-bold text-indigo-800">Let’s craft your plan</h2>
          <p className="mt-2 text-sm text-indigo-900/90">
            Tell us about your goals, team size, and current stack. We’ll send a
            tailored proposal with timeline and outcomes.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/contact?subject=Team%20Training%20Inquiry"
              className="inline-flex items-center rounded-lg px-4 py-2 bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition"
            >
              Contact Sales
            </Link>
            <Link
              href="/workshops"
              className="inline-flex items-center rounded-lg px-4 py-2 border border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-sm transition"
            >
              See Workshops
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
