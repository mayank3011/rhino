import React from "react";
import Image from "next/image";
import Link from "next/link";
import connect from "../lib/mongodb";
import Course from "../models/Course";
import CourseCard from "../components/CourseCard";
import ImpactSection from "../components/ImpactSection";
import Hero from "../components/Hero";
import FAQ from "../components/FAQ";

// --- SEO Metadata ---
export const metadata = {
  title: "RhinoGeeks: Master Coding with Expert-Led Programs",
  description:
    "Level up your career with hands-on coding bootcamps and mentorship from industry experts. Build a portfolio of live projects and land your dream job.",
  keywords: [
    "coding bootcamp",
    "tech mentorship",
    "web development courses",
    "RhinoGeeks",
    "learn to code",
    "full-stack development",
  ],
  authors: [{ name: "RhinoGeeks" }],
  openGraph: {
    title: "RhinoGeeks: Master Coding with Expert-Led Programs",
    description:
      "Level up your career with hands-on coding bootcamps and mentorship from industry experts. Build a portfolio of live projects and land your dream job.",
    url: "https://www.rhinogeeks.com",
    siteName: "RhinoGeeks",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "RhinoGeeks: Empowering developers with hands-on coding programs",
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

// --- Types / helpers ---
interface ICourseLean {
  _id: string | { toString(): string };
  title?: string;
  slug?: string;
  description?: string;
  duration?: string;
  price?: number | string;
  image?: string;
  mentor?: {
    _id?: string | { toString(): string };
    id?: string;
    name?: string;
    image?: string;
  } | null;
  published?: boolean;
  createdAt?: Date | string;
}
interface FeaturedCourse {
  _id: string;
  title: string;
  slug?: string;
  excerpt: string;
  duration?: string;
  price: number;
  image?: string;
  mentors: { id: string; name?: string; avatar?: string }[];
}
function toIdString(id: string | { toString(): string } | undefined): string {
  if (!id) return "";
  return typeof id === "string" ? id : id.toString();
}
function toOptionalString(v: unknown): string | undefined {
  return v == null ? undefined : String(v);
}
function toNumber(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

// --- Static UI data ---
const brands = [
  { id: "brand-1", src: "/google.svg", alt: "Google" },
  { id: "brand-2", src: "/amazon.svg", alt: "Amazon" },
  { id: "brand-3", src: "/microsoft.svg", alt: "Microsoft" },
  { id: "brand-4", src: "/netlify.svg", alt: "Netlify" },
  { id: "brand-5", src: "/vercel.svg", alt: "Vercel" },
  { id: "brand-6", src: "/stripe.svg", alt: "Stripe" },
];

const categories = [
  { id: "c1", name: "Full-Stack Dev", href: "/courses?category=fullstack", icon: "🧩" },
  { id: "c2", name: "Data & AI", href: "/courses?category=ai", icon: "🤖" },
  { id: "c3", name: "Cloud & DevOps", href: "/courses?category=cloud", icon: "☁️" },
  { id: "c4", name: "Frontend", href: "/courses?category=frontend", icon: "🎨" },
  { id: "c5", name: "Backend", href: "/courses?category=backend", icon: "🛠️" },
  { id: "c6", name: "Career & Soft Skills", href: "/courses?category=career", icon: "🚀" },
];

const mentors = [
  { id: "m1", name: "Neha Verma", role: "Senior SWE • Google", avatar: "/mentors/priya.png" },
  { id: "m2", name: "Arjun Rao", role: "Principal Engineer • Amazon", avatar: "/mentors/arjun.png" },
  { id: "m3", name: "Priya Iyer", role: "Data Scientist • Microsoft", avatar: "/mentors/priya.png" },
  { id: "m4", name: "Rahul Jain", role: "DevOps Lead • Stripe", avatar: "/mentors/arjun.png" },
];

const upcoming = [
  { id: "u1", title: "AI-Powered Portfolio Workshop", date: "Nov 15, 2025", desc: "Build a personal portfolio website with AI-powered features." },
  { id: "u2", title: "Full-Stack MERN Bootcamp", date: "Dec 1, 2025", desc: "Master MongoDB, Express, React, and Node.js in 6 weeks." },
  { id: "u3", title: "Cloud & DevOps Crash Course", date: "Jan 10, 2026", desc: "Hands-on training on AWS, Docker, and CI/CD pipelines." },
];

const whyUs = [
  { id: "f1", title: "Industry Mentors", desc: "Learn from working professionals who guide you with real-world insights." },
  { id: "f2", title: "Live Projects", desc: "Work on live projects that help you build a strong portfolio." },
  { id: "f3", title: "Flexible Learning", desc: "Access recorded sessions and self-paced materials anytime." },
  { id: "f4", title: "Global Community", desc: "Join a network of learners and professionals worldwide." },
];

export default async function Home() {
  await connect();

  const rawFeatured = await Course.find({ published: true })
    .sort({ createdAt: -1 })
    .limit(6)
    .lean<ICourseLean[]>();

  const featured: FeaturedCourse[] = rawFeatured.map((c) => ({
    _id: toIdString(c._id),
    title: c.title ?? "Untitled",
    slug: toOptionalString(c.slug),
    excerpt: c.description ? c.description.slice(0, 180) : "",
    duration: toOptionalString(c.duration),
    price: typeof c.price === "number" ? c.price : toNumber(c.price),
    image: toOptionalString(c.image),
    mentors: c.mentor
      ? [
          {
            id: toIdString(c.mentor._id ?? c.mentor.id),
            name: toOptionalString(c.mentor.name),
            avatar: toOptionalString(c.mentor.image),
          },
        ]
      : [],
  }));

  return (
    <>
      {/* Hero + Impact keep your existing components for brand consistency */}
      <Hero />
      <ImpactSection />

      {/* Featured Courses */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-7 py-10">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Featured Coding Programs
          </h2>
          <p className="mt-3 text-slate-600">
            Curated, mentor-led programs to help you ship real projects.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {featured.map((course) => (
            <CourseCard key={course._id || course.slug} course={course} />
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-300 text-slate-800 hover:bg-slate-50 transition"
          >
            View all courses
            <span aria-hidden>→</span>
          </Link>
        </div>
      </section>

      {/* Tracks */}
      <section className="bg-gradient-to-br from-indigo-50 to-emerald-50 py-14">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 text-center">
            Explore by Tracks
          </h2>
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={cat.href}
                className="group bg-white rounded-2xl border border-slate-200 p-5 text-center hover:shadow-md hover:-translate-y-0.5 transition"
              >
                <div className="text-2xl">{cat.icon}</div>
                <div className="mt-2 font-semibold text-slate-800 group-hover:text-indigo-600">
                  {cat.name}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof (Brands) */}
      <section className="bg-white py-14">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h3 className="text-2xl md:text-3xl font-bold text-center text-slate-800 mb-8">
            Trusted by Developers at Top Companies
          </h3>

          <div className="relative overflow-hidden">
            <ul className="flex items-center gap-10 animate-marquee group-hover:pause">
              {brands.map((brand) => (
                <li key={brand.id} className="shrink-0">
                  <Image
                    src={brand.src}
                    alt={brand.alt}
                    width={120}
                    height={40}
                    className="h-10 w-auto object-contain opacity-80"
                  />
                </li>
              ))}
            </ul>
            <ul
              className="flex items-center gap-10 animate-marquee2 group-hover:pause absolute inset-0"
              aria-hidden="true"
            >
              {brands.map((brand) => (
                <li key={`${brand.id}-dup`} className="shrink-0">
                  <Image
                    src={brand.src}
                    alt={brand.alt}
                    width={120}
                    height={40}
                    className="h-10 w-auto object-contain opacity-80"
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Why Us */}
      <section className="bg-slate-50 py-16">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-center text-slate-900">
            Why Choose RhinoGeeks?
          </h2>
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyUs.map((item) => (
              <div
                key={item.id}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition"
              >
                <h3 className="text-lg font-semibold text-indigo-700">
                  {item.title}
                </h3>
                <p className="text-slate-600 mt-3 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mentors */}
      <section className="bg-white py-16">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-gray-900 text-center">
            Learn with Industry Mentors
          </h2>
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-6">
            {mentors.map((m) => (
              <div
                key={m.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 text-center hover:shadow-md transition"
              >
                <div className="mx-auto w-20 h-20 rounded-full overflow-hidden border">
                  <Image
                    src={m.avatar}
                    alt={m.name}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="mt-3 font-semibold text-slate-900">{m.name}</div>
                <div className="text-xs text-slate-600">{m.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming */}
      <section className="bg-gradient-to-br from-indigo-50 to-white py-16">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-center text-gray-900">
            Upcoming Programs
          </h2>
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {upcoming.map((program) => (
              <div
                key={program.id}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition"
              >
                <h3 className="text-xl font-semibold text-indigo-700">
                  {program.title}
                </h3>
                <p className="text-sm text-slate-500 mt-1">Starts {program.date}</p>
                <p className="text-slate-700 mt-3 text-sm">{program.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ (Framer Motion accordions) */}
      <section className="bg-slate-50 py-16">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-center text-gray-900">
            Frequently Asked Questions
          </h2>
          <FAQ
            items={[
              {
                q: "How are classes conducted?",
                a: "Live sessions with recordings, community discussions, and project reviews with mentors.",
              },
              {
                q: "Do I get a certificate?",
                a: "Yes, a verifiable certificate is issued upon successful completion of the program.",
              },
              {
                q: "Are there scholarships?",
                a: "We occasionally run need-based and merit scholarships. Watch your email for announcements.",
              },
              {
                q: "What’s the refund policy?",
                a: "Full refunds before the cohort starts. Pro-rated refunds during week 1. See our Refund Policy for details.",
              },
            ]}
          />
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-16 bg-white">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200 p-8 md:p-10 text-center bg-gradient-to-r from-indigo-50 to-emerald-50">
            <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900">
              Stay in the loop
            </h3>
            <p className="mt-2 text-slate-600">
              Get new cohorts, workshops, and exclusive discounts in your inbox.
            </p>
            <form
              action="/api/newsletter"
              method="POST"
              className="mt-6 flex flex-col sm:flex-row items-center gap-3 justify-center"
            >
              <input
                type="email"
                name="email"
                required
                placeholder="you@domain.com"
                className="w-full sm:w-80 px-4 py-3 rounded-xl border border-slate-300 focus:outline-none"
              />
              <button
                type="submit"
                className="px-5 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-indigo-600 py-16 text-white text-center">
        <h2 className="text-3xl font-extrabold mb-4">
          Ready to Start Your Coding Journey?
        </h2>
        <p className="text-lg mb-6 opacity-95">
          Join thousands of learners building their tech careers with RhinoGeeks.
        </p>
        <Link
          href="/courses"
          className="inline-flex px-6 py-3 bg-white text-indigo-700 font-semibold rounded-xl shadow hover:bg-slate-100 transition"
        >
          Browse Courses →
        </Link>
      </section>
    </>
  );
}
