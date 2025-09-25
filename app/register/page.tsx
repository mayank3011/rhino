// app/course/[slug]/register/page.tsx
import React from "react";
import connect from "@/lib/mongodb";
import Course from "@/models/Course";
import { notFound } from "next/navigation";
import RegisterForm from "@/components/RegisterForm";

type Props = { params: { slug: string } };

export default async function Page({ params }: Props) {
  await connect();
  const slugOrId = params.slug;
  // find by slug first, fallback to id
  let course = await Course.findOne({ slug: slugOrId }).lean();
  if (!course) {
    try {
      course = await Course.findById(slugOrId).lean();
    } catch {
      course = null;
    }
  }
  if (!course) return notFound();

  // pick fields to pass to client
  const courseJson = {
    _id: String(course._id),
    title: course.title ?? "",
    slug: course.slug ?? "",
    description: course.description ?? "",
    price: course.price ?? 0,
    duration: course.duration ?? "",
    image: course.image ?? "",
    mentor: course.mentor ?? null,
  };

  return (
    <div className="container mx-auto px-6 py-10">
      <div className="max-w-4xl mx-auto">
        <RegisterForm course={courseJson} />
      </div>
    </div>
  );
}
