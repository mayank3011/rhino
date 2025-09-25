// app/mentorship/page.tsx
import Link from "next/link";

export const metadata = {
  title: "Mentorship | RhinoGeeks",
  description: "Personalized 1:1 and small-cohort mentorship to accelerate your career.",
};

export default function MentorshipPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {/* Hero */}
        <div className="text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            Level Up with Personalized Mentorship
          </h1>
          <p className="mt-4 text-slate-600 max-w-2xl mx-auto">
            Get matched with a mentor working in the industry. Build projects,
            get code reviews, and plot a roadmap to your next role.
          </p>
          <div className="mt-6">
            <Link
              href="#apply"
              className="inline-flex items-center rounded-lg px-5 py-2.5 bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition"
            >
              Apply for Mentorship
            </Link>
          </div>
        </div>

        {/* Tracks */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              h: "Frontend Engineering",
              p: "React, Next.js, TypeScript, testing, performance, and architecture.",
            },
            {
              h: "Backend & DevOps",
              p: "Node, APIs, databases, Docker, CI/CD, monitoring and reliability.",
            },
            {
              h: "AI & Product",
              p: "Prompting, LLM apps, integrations, UX for AI and shipping value.",
            },
          ].map((t) => (
            <div key={t.h} className="rounded-xl bg-indigo-50/40 border border-indigo-100 p-6">
              <h3 className="text-lg font-semibold text-indigo-700">{t.h}</h3>
              <p className="mt-2 text-sm text-slate-700">{t.p}</p>
            </div>
          ))}
        </div>

        {/* What you get */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { h: "1:1 Sessions", p: "Bi-weekly deep dives tailored to your goals." },
            { h: "Code Reviews", p: "Actionable feedback on real projects." },
            { h: "Career Guidance", p: "Portfolio reviews, interview prep, and referrals." },
            { h: "Accountability", p: "Milestones and check-ins to keep you moving." },
          ].map((f) => (
            <div key={f.h} className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="text-base font-semibold text-slate-900">{f.h}</h3>
              <p className="mt-2 text-sm text-slate-600">{f.p}</p>
            </div>
          ))}
        </div>

        {/* Pricing */}
        <div className="mt-14">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900">Mentorship Plans</h2>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: "Starter",
                price: "₹4,999 / mo",
                points: ["2 sessions / month", "Email support", "Project roadmap"],
              },
              {
                name: "Pro",
                price: "₹9,999 / mo",
                points: [
                  "4 sessions / month",
                  "Priority feedback",
                  "Mock interview",
                ],
              },
              {
                name: "Elite",
                price: "₹19,999 / mo",
                points: [
                  "Weekly sessions",
                  "Career strategy",
                  "Hands-on collaboration",
                ],
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className="rounded-2xl border border-slate-200 p-6 bg-white flex flex-col"
              >
                <div className="text-sm font-semibold text-indigo-700">{plan.name}</div>
                <div className="mt-1 text-3xl font-extrabold text-slate-900">
                  {plan.price}
                </div>
                <ul className="mt-4 text-sm text-slate-700 space-y-2">
                  {plan.points.map((p) => (
                    <li key={p}>• {p}</li>
                  ))}
                </ul>
                <div className="mt-6">
                  <Link
                    href="#apply"
                    className="inline-flex items-center rounded-lg px-4 py-2 bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition"
                  >
                    Choose {plan.name}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Apply */}
        <div id="apply" className="mt-16 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
          <h2 className="text-xl font-bold text-emerald-800">Apply for Mentorship</h2>
          <p className="mt-2 text-sm text-emerald-900/90">
            Tell us your goals, current skill level, and preferred track. We’ll
            match you with a mentor and reach out within 48 hours.
          </p>
          <div className="mt-4">
            <Link
              href="/contact?subject=Mentorship%20Application"
              className="inline-flex items-center rounded-lg px-4 py-2 bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition"
            >
              Submit Application
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
