// app/course/[slug]/register/page.tsx
import React from "react";
import connect from "@/lib/mongodb";
import Course from "@/models/Course";
import { notFound, redirect } from "next/navigation";
import RegisterForm from "@/components/RegisterForm";
import { Document } from "mongoose";

type Props = { params: { slug: string } };

// Define interface for type safety
interface ICourseDocument extends Document {
  title: string;
  slug?: string;
  description?: string;
  price?: number;
  duration?: string;
  image?: string;
  mentor?: {
    name?: string;
    image?: string;
    role?: string;
  };
}

interface CourseData {
  _id: string;
  title: string;
  slug?: string;
  description?: string;
  price?: number;
  duration?: string;
  image?: string;
  mentor?: {
    name?: string;
    image?: string;
    role?: string;
  } | null;
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Robust nested register page:
 * - Looks up by slug (exact, decoded, case-insensitive), then by _id fallback
 * - If not found, redirects to the global /register?course=slug fallback
 * - Returns a sanitized course JSON for the client RegisterForm
 */
export default async function CourseRegisterPage({ params }: Props) {
  const slugOrId = String(params?.slug ?? "").trim();
  
  if (!slugOrId) {
    return redirect(`/register`);
  }

  // Connect to database
  try {
    await connect();
  } catch (error: unknown) {
    console.error("MongoDB connection failed:", error);
    return notFound();
  }

  let course: ICourseDocument | null = null;
  
  try {
    // 1) Exact slug match
    course = (await Course.findOne({ slug: slugOrId }).lean()) as ICourseDocument | null;
    
    // 2) Try decoded slug (sometimes incoming values are encoded)
    if (!course) {
      const decoded = decodeURIComponent(slugOrId);
      if (decoded !== slugOrId) {
        course = (await Course.findOne({ slug: decoded }).lean()) as ICourseDocument | null;
      }
    }
    
    // 3) Case-insensitive slug match
    if (!course) {
      const regexPattern = new RegExp(`^${escapeRegExp(slugOrId)}$`, "i");
      course = (await Course.findOne({ slug: regexPattern }).lean()) as ICourseDocument | null;
    }
    
    // 4) Fallback: if slug looks like a 24-hex ObjectId, try findById
    if (!course && /^[a-fA-F0-9]{24}$/.test(slugOrId)) {
      try {
        course = (await Course.findById(slugOrId).lean()) as ICourseDocument | null;
      } catch (findByIdError: unknown) {
        console.error("Course findById error:", findByIdError);
        course = null;
      }
    }
  } catch (error: unknown) {
    console.error("Course lookup error:", error);
    course = null;
  }

  if (!course) {
    // Helpful fallback: redirect to global register page which accepts ?course=<slugOrId>
    console.warn(`Course not found for slugOrId="${slugOrId}". Redirecting to global /register fallback.`);
    return redirect(`/register?course=${encodeURIComponent(slugOrId)}`);
  }

  // Sanitize and serialize course data for client
  const courseData: CourseData = {
    _id: String(course._id),
    title: course.title ?? "",
    slug: course.slug ?? "",
    description: course.description ?? "",
    price: Number(course.price ?? 0),
    duration: course.duration ?? "",
    image: course.image ?? "",
    mentor: course.mentor ? {
      name: course.mentor.name ?? "",
      image: course.mentor.image ?? "",
      role: course.mentor.role ?? "",
    } : null,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <div className="max-w-6xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8 lg:mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-indigo-200 mb-4">
              <div className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-indigo-700">Course Registration</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
              Join {courseData.title}
            </h1>
            
            <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Complete your registration below to secure your spot in this course. 
              You&apos;ll receive confirmation and access details via email.
            </p>
          </div>

          {/* Registration Form */}
          <div className="bg-white rounded-2xl border border-indigo-100 shadow-xl overflow-hidden">
            <div className="p-4 sm:p-6 lg:p-8">
              <RegisterForm course={courseData} />
            </div>
          </div>

          {/* Footer Info */}
          <div className="mt-8 sm:mt-12">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-indigo-100 p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-center">
                
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Secure Payment</h3>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      Safe and encrypted payment processing
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Email Confirmation</h3>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      Instant confirmation and access details
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-3 sm:col-span-2 lg:col-span-1">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base">24/7 Support</h3>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      Get help whenever you need it
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-4 text-sm text-gray-600">
              <span>Need help?</span>
              <div className="flex items-center gap-4">
                <a 
                  href="/contact" 
                  className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors duration-200"
                >
                  Contact Support
                </a>
                <span className="text-gray-300">|</span>
                <a 
                  href={`/course/${encodeURIComponent(courseData.slug ?? courseData._id)}`}
                  className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors duration-200"
                >
                  Course Details
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}