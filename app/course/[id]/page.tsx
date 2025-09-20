// app/course/[id]/page.tsx
import connect from "../../../lib/mongodb";
import Course from "../../../models/Course";
import { notFound } from "next/navigation";

export default async function CoursePage({ params }: { params: { id: string } }) {
  await connect();
  // try slug then _id
  const course = await Course.findOne({ slug: params.id }) || await Course.findById(params.id);
  if (!course) notFound();

  return (
    <div className="container mx-auto p-6">
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <h1 className="text-3xl font-bold">{course.title}</h1>
          <p className="mt-4 text-slate-700">{course.description}</p>
          {/* add curriculum, FAQs, lessons later */}
        </div>

        <aside className="bg-white border p-4 rounded">
          <div className="text-sm text-slate-500">Price</div>
          <div className="text-2xl font-bold">₹{course.price}</div>
          <div className="mt-4">
            <a href={`/register?course=${course.slug ?? course._id}`} className="btn-primary block text-center">Register</a>
          </div>
        </aside>
      </div>
    </div>
  );
}
