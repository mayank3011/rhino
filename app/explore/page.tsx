// app/page.tsx (simplified)
import Hero from "../../components/Hero";
import CourseCard, { Course } from "../../components/CourseCard";

async function getFeatured() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/courses`, { cache: "no-store" });
  return res.ok ? (await res.json()) as Course[] : [];
}

export default async function Page() {
  const courses = await getFeatured();
  return (
    <>
      <Hero />
      <section className="container mx-auto px-6 py-12">
        <h2 className="text-2xl font-semibold mb-6">Popular courses</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.slice(0,6).map(c => <CourseCard key={c._id ?? c.slug} course={c} />)}
        </div>
      </section>
    </>
  );
}
