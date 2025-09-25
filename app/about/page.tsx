// app/about/page.tsx
import React from "react";
import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "About • RhinoGeeks",
  description: "About RhinoGeeks — mission, team and values.",
};

export default function AboutPage() {
  return (
    <main className="container mx-auto px-4 py-12 max-w-6xl">
      <section className="grid gap-8 lg:grid-cols-2 items-center">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">About RhinoGeeks</h1>
          <p className="mt-4 text-slate-700 leading-relaxed">
            RhinoGeeks is on a mission to help people learn practical skills and ship real products. We build courses, mentorship programs
            and cohort-based learning to help career changers and teams upskill.
          </p>

          <div className="mt-6 space-y-4">
            <p className="text-slate-700">
              We focus on human-first teaching, short/high-impact projects and ongoing placement support. Our instructors are industry
              practitioners.
            </p>

            <Link href="/courses" className="inline-block mt-2 px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700">
              Browse courses
            </Link>
          </div>
        </div>

        <div className="rounded-lg overflow-hidden shadow-lg bg-slate-50">
          {/* put an SVG or public image at /public/about-hero.jpg */}
          <Image
            src="/about-hero.jpg"
            alt="Students learning"
            width={1200}
            height={800}
            className="w-full h-72 object-cover"
            priority
          />
        </div>
      </section>

      <section className="mt-12 grid gap-6 md:grid-cols-3">
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="font-semibold">Mission</h3>
          <p className="mt-2 text-sm text-slate-600">Help 1M people ship products and advance their careers with applied learning.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="font-semibold">Approach</h3>
          <p className="mt-2 text-sm text-slate-600">Project-first, small cohorts, mentor feedback, career-oriented curriculum.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="font-semibold">Community</h3>
          <p className="mt-2 text-sm text-slate-600">Active alumni network, study groups and job-referral channels.</p>
        </div>
      </section>
    </main>
  );
}
