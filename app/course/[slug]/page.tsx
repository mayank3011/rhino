// app/course/[slug]/page.tsx
import React from "react";
import connect from "@/lib/mongodb";
import Course from "@/models/Course";
import Link from "next/link";
import Image from "next/image";
import CourseModules from "@/components/CourseModules";
import { Document } from "mongoose";

type Props = { params: { slug: string } };

// Define interfaces for type safety
interface ICourseDocument extends Document {
  title: string;
  slug?: string;
  description?: string;
  longDescription?: string;
  price?: number;
  originalPrice?: number;
  duration?: string;
  image?: string;
  mentor?: {
    name?: string;
    image?: string;
    role?: string;
  };
  keyOutcomes?: string[];
  modules?: Array<{ title?: string; topics?: Array<{ text?: string }> }>;
  seats?: number | string;
  startTime?: string | Date;
}

interface IClientCourse {
  _id: string;
  slug: string;
  title: string;
  description: string;
  longDescription: string;
  image: string;
  price: number;
  originalPrice: number | null;
  duration: string;
  startTime: Date | null;
  mentor: ICourseDocument['mentor'] | null;
  keyOutcomes: string[];
  modules: ICourseDocument['modules'];
  seats: number | string | null;
}

function formatPrice(price?: number): string {
  if (price == null || price === 0) return "Free";
  try {
    return `₹${Number(price).toLocaleString("en-IN")}`;
  } catch {
    return `₹${price}`;
  }
}

export default async function CourseDetailPage({ params }: Props) {
  const slugOrId = String(params?.slug ?? "").trim();

  // Connect & load course
  let courseDoc: ICourseDocument | null = null;
  try {
    await connect();
    courseDoc = (await Course.findOne({ slug: slugOrId }).lean()) as ICourseDocument | null;
    if (!courseDoc) {
      try {
        courseDoc = (await Course.findById(slugOrId).lean()) as ICourseDocument | null;
      } catch {
        courseDoc = null;
      }
    }
  } catch (error) {
    console.error("Course fetch error:", error);
    courseDoc = null;
  }

  if (!courseDoc) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-100 py-8 sm:py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-white p-6 sm:p-8 lg:p-12 rounded-2xl shadow-xl border border-indigo-200 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-2xl sm:text-3xl font-bold">?</span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Course Not Found
            </h2>
            <p className="mt-4 text-sm sm:text-base text-gray-600 max-w-md mx-auto">
              The requested course <code className="bg-gray-100 px-2 py-1 rounded text-indigo-600 font-mono text-xs">{slugOrId || "(empty)"}</code> could not be located.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
              <Link 
                href="/courses" 
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
              >
                Browse Courses
              </Link>
              <Link 
                href="/" 
                className="px-6 py-3 border-2 border-indigo-200 text-indigo-700 rounded-xl hover:bg-indigo-50 transition-all duration-200 font-medium"
              >
                Go Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Convert to plain JSON for client components
  const course: IClientCourse = JSON.parse(JSON.stringify(courseDoc));

  const title = course.title ?? "Untitled course";
  const description = course.description ?? "";
  const heroImage = course.image ?? "";
  const price = Number(course.price ?? 0);
  const originalPrice: number | null = course.originalPrice ?? null;
  const duration: string = course.duration ?? "";
  const startTime = course.startTime ? new Date(course.startTime) : null;
  const mentor = course.mentor ?? null;
  const keyOutcomes: string[] = Array.isArray(course.keyOutcomes) ? course.keyOutcomes.map(String) : [];
  const modules = Array.isArray(course.modules) ? course.modules : [];
  const seats = course.seats ?? null;
  const longDescription = course.longDescription ?? description ?? "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8">

            {/* LEFT: Main Content */}
            <div className="xl:col-span-8 space-y-6 lg:space-y-8">
              
              {/* Hero Section */}
              <div className="bg-white rounded-2xl border border-indigo-100 overflow-hidden shadow-xl">
                <div className="flex flex-col lg:flex-row">
                  
                  {/* Image Section */}
                  <div className="w-full lg:w-1/2 p-4 sm:p-6">
                    <div className="w-full h-48 sm:h-64 lg:h-72 xl:h-80 rounded-xl border border-indigo-100 overflow-hidden bg-gradient-to-br from-indigo-50 to-purple-50 relative">
                      {heroImage ? (
                        <Image 
                          src={heroImage} 
                          alt={title} 
                          fill 
                          className="object-cover" 
                          priority
                          sizes="(max-width: 1024px) 100vw, 50vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xl font-bold">📚</span>
                            </div>
                            <span className="text-indigo-400 font-medium">Course Preview</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="w-full lg:w-1/2 p-4 sm:p-6 lg:p-8">
                    <div className="h-full flex flex-col">
                      <div className="flex-1">
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent leading-tight">
                          {title}
                        </h1>

                        {description && (
                          <p className="text-sm sm:text-base text-gray-600 mt-3 sm:mt-4 line-clamp-3">
                            {description}
                          </p>
                        )}

                        {/* Course Meta */}
                        <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-indigo-100">
                          <div>
                            <div className="text-xs text-gray-500 font-medium">Start Date</div>
                            <div className="text-sm sm:text-base font-semibold text-gray-800 mt-1">
                              {startTime ? startTime.toLocaleDateString('en-IN', { 
                                day: 'numeric', 
                                month: 'short', 
                                year: 'numeric' 
                              }) : "TBD"}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 font-medium">Duration</div>
                            <div className="text-sm sm:text-base font-semibold text-gray-800 mt-1">
                              {duration || "Self-paced"}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Instructor */}
                      <div className="mt-6 pt-4 border-t border-indigo-100">
                        <div className="text-sm font-medium text-gray-700 mb-3">Instructor</div>
                        {mentor ? (
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100 ring-2 ring-indigo-200 relative flex-shrink-0">
                              {mentor.image ? (
                                <Image 
                                  src={mentor.image} 
                                  alt={mentor.name ?? "Instructor"} 
                                  fill 
                                  className="object-cover" 
                                  sizes="56px"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-lg font-bold bg-gradient-to-br from-indigo-400 to-purple-500 text-white">
                                  {(mentor.name || "I").slice(0, 1).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="text-sm sm:text-base font-semibold text-gray-900">
                                {mentor.name ?? "Expert Instructor"}
                              </div>
                              <div className="text-xs sm:text-sm text-indigo-600">
                                {mentor.role ?? "Lead Instructor"}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">Expert instruction included</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* CTA Section */}
              <div className="bg-white rounded-2xl border border-indigo-100 shadow-lg p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
                  <div className="flex items-center gap-4 sm:gap-6">
                    {originalPrice && (
                      <div className="text-base sm:text-lg text-gray-400 line-through">
                        ₹{originalPrice.toLocaleString("en-IN")}
                      </div>
                    )}
                    <div className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      {formatPrice(price)}
                    </div>
                  </div>

                  <Link
                    href={`/course/${encodeURIComponent(course.slug ?? course._id)}/register`}
                    className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 rounded-xl text-base sm:text-lg font-bold shadow-lg transition-all duration-200 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white hover:from-indigo-700 hover:via-purple-700 hover:to-blue-700 hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    Enroll Now
                  </Link>
                </div>
              </div>

              {/* Modules Section */}
              {modules && modules.length > 0 && (
                <div className="bg-white rounded-2xl border border-indigo-100 shadow-lg p-4 sm:p-6">
                  <CourseModules modules={modules} accentColor="#6366f1" />
                </div>
              )}
            </div>

            {/* RIGHT: Sticky Sidebar */}
            <div className="xl:col-span-4">
              <div className="sticky top-6">
                <div className="bg-white rounded-2xl border border-indigo-100 shadow-xl p-4 sm:p-6 space-y-6">
                  
                  {/* Header */}
                  <div className="pb-4 border-b border-indigo-100">
                    <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      Course Overview
                    </h2>
                  </div>

                  {/* Description */}
                  {longDescription && (
                    <div>
                      <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                        {longDescription}
                      </p>
                    </div>
                  )}

                  {/* Learning Outcomes */}
                  {keyOutcomes.length > 0 && (
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-indigo-100">
                        What you&apos;ll learn
                      </h3>
                      <ul className="space-y-2 sm:space-y-3">
                        {keyOutcomes.map((outcome: string, index: number) => (
                          <li key={index} className="flex items-start gap-3">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <span className="text-sm sm:text-base text-gray-700 leading-relaxed">
                              {outcome}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Course Details */}
                  <div className="pt-4 border-t border-indigo-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Seats remaining</span>
                      <span className={`text-sm font-bold ${
                        seats === "Limited" ? 'text-amber-600' : 
                        typeof seats === 'number' && seats < 10 ? 'text-red-600' :
                        'text-green-600'
                      }`}>
                        {seats ?? "Unlimited"}
                      </span>
                    </div>

                    <Link 
                      href={`/course/${encodeURIComponent(course.slug ?? course._id)}/register`} 
                      className="block w-full text-center px-4 py-3 border-2 border-indigo-200 rounded-xl text-sm sm:text-base font-medium text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-200"
                    >
                      Start Registration
                    </Link>
                  </div>

                  {/* Additional Info */}
                  <div className="pt-4 border-t border-indigo-100 space-y-3">
                    <div className="text-xs sm:text-sm text-gray-500 text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>Certificate of completion</span>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <span>Lifetime access to materials</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}