// app/page.tsx
import React from "react";
import Hero from "../components/Hero";
import connect from "../lib/mongodb";
import Course from "../models/Course";
import CourseCard from "../components/CourseCard";
import ImpactSection from "../components/ImpactSection";
import Image from "next/image";

export const metadata = {
  title: "Home - Rhino Courses",
};

export default async function Home() {
  await connect();
  
  // fetch latest featured courses as plain objects
  const rawFeatured = await Course.find({ published: true }).sort({ createdAt: -1 }).limit(6).lean();
  
  // serialize to guarantee primitives (ObjectId -> string, Date -> ISO)
  const featured = rawFeatured.map(course => ({
    _id: course._id.toString(),
    title: course.title,
    slug: course.slug,
    description: course.description,
    niche: course.niche,
    category: course.category,
    price: course.price,
    image: course.image,
    imagePublicId: course.imagePublicId,
    published: course.published,
    createdAt: course.createdAt?.toISOString(),
    updatedAt: course.updatedAt?.toISOString(),
    __v: course.__v,
  }));
  
  // static testimonials/brands for demo; you can fetch from DB and serialize similarly
  const testimonials = [
    { id: "testimonial-1", name: "Anita", text: "Great hands-on course!" },
    { id: "testimonial-2", name: "Ravi", text: "Built a portfolio project within 2 weeks." },
  ];
  
  const brands = [
    { id: "brand-1", src: "/images/brand1.png", alt: "Brand 1" },
    { id: "brand-2", src: "/images/brand2.png", alt: "Brand 2" },
  ];

  return (
    <>
      <Hero />
      <ImpactSection />
      
      <section className="container mx-auto p-6">
        <h2 className="text-2xl font-semibold mb-4">Featured courses</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map((course, index: number) => {
            // Use the properly serialized _id string
            const key = course._id || course.slug || `course-${index}`;
            return <CourseCard key={key} course={course} />;
          })}
        </div>
      </section>

      <section className="bg-slate-50 py-8">
        <div className="container mx-auto p-6">
          <h3 className="text-xl font-semibold mb-4">Trusted by</h3>
          <div className="flex gap-6 items-center">
            {brands.map((brand) => (
              <Image
                key={brand.id}
                src={brand.src}
                alt={brand.alt}
                width={120}
                height={40}
                className="h-10 w-auto object-contain"
                priority={false}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto p-6">
        <h3 className="text-xl font-semibold mb-4">What students say</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="bg-white p-4 border rounded">
              <div className="font-medium">{testimonial.name}</div>
              <div className="text-sm text-slate-600">{testimonial.text}</div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}