// components/admin/AdminCourseItem.tsx
"use client";
import React, { useState } from "react";
import AdminCourseForm from "./AdminCourseForm";
import { mutate } from "swr";
import toast from "react-hot-toast";
import fetcher from "../../utils/fetcher";
import Image from "next/image";

// Types
interface CourseMentor {
  name?: string;
  image?: string;
  imagePublicId?: string;
}

interface Course {
  _id: string;
  title: string;
  slug?: string;
  description?: string;
  niche?: string;
  categoryName?: string;
  price?: number;
  duration?: string;
  startTime?: string;
  keyOutcomes?: string[];
  mentor?: CourseMentor;
  image?: string;
  metaTitle?: string;
  metaDescription?: string;
}

interface AdminCourseItemProps {
  course: Course;
}

export default function AdminCourseItem({ course }: AdminCourseItemProps) {
  const [editing, setEditing] = useState(false);
  const key = "/api/admin/courses";

  function formatDate(dateString: string | null | undefined): string {
    if (!dateString) return "";
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return String(dateString);
    }
  }

  async function handleDelete(): Promise<void> {
    if (!confirm("Delete this course? This cannot be undone.")) return;
    
    try {
      // Optimistic removal
      const currentCourses = await fetcher(key);
      mutate(key, currentCourses.filter((c: Course) => c._id !== course._id), false);
      
      const response = await fetch(`/api/admin/courses/${course._id}`, { 
        method: "DELETE" 
      });
      
      const result = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        throw new Error(result?.error || "Delete failed");
      }
      
      toast.success("Course deleted");
      mutate(key); // Revalidate
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Delete failed";
      toast.error(message);
      mutate(key); // Refetch to restore
    }
  }

  function handleSaved(): void {
    setEditing(false);
    toast.success("Course updated");
    mutate(key);
  }

  return (
    <div className="bg-white border border-indigo-100 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 overflow-hidden">
      <div className="p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          
          {/* Course Image */}
          <div className="w-full lg:w-32 h-32 lg:h-32 flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-100 relative">
            {course.image ? (
              <Image 
                src={course.image} 
                alt={course.title} 
                fill
                className="object-cover" 
                sizes="(max-width: 1024px) 100vw, 128px"
              />
            ) : course.mentor?.image ? (
              <Image 
                src={course.mentor.image} 
                alt={course.mentor?.name || "mentor"} 
                fill
                className="object-cover" 
                sizes="(max-width: 1024px) 100vw, 128px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-8 h-8 mx-auto mb-2 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">📚</span>
                  </div>
                  <span className="text-xs text-indigo-400 font-medium">No Image</span>
                </div>
              </div>
            )}
          </div>

          {/* Course Details */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              
              {/* Left: Course Info */}
              <div className="min-w-0 flex-1 space-y-3">
                
                {/* Title and Badges */}
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <h4 className="font-bold text-lg lg:text-xl text-gray-900 truncate">
                      {course.title}
                    </h4>
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      {course.slug && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-mono bg-indigo-50 text-indigo-700 rounded-md border border-indigo-200">
                          /{course.slug}
                        </span>
                      )}

                      {(course.metaTitle || course.metaDescription) && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-50 text-yellow-800 rounded-md border border-yellow-200">
                          SEO
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-xs sm:text-sm text-gray-500 truncate">
                    {course.niche ?? "—"}
                    {course.categoryName && (
                      <>
                        {" • "}
                        <span className="font-medium text-indigo-600">{course.categoryName}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Description */}
                {course.description && (
                  <div className="text-sm text-gray-700 line-clamp-2 leading-relaxed">
                    {course.description}
                  </div>
                )}

                {/* Meta Information */}
                <div className="flex flex-wrap gap-4 text-xs text-gray-600">
                  {course.duration && (
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      <span>Duration: <span className="font-medium text-gray-800">{course.duration}</span></span>
                    </div>
                  )}

                  {course.startTime && (
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                      <span>Starts: <span className="font-medium text-gray-800">{formatDate(course.startTime)}</span></span>
                    </div>
                  )}

                  {course.mentor?.name && (
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                      <span>Mentor: <span className="font-medium text-gray-800">{course.mentor.name}</span></span>
                    </div>
                  )}
                </div>

                {/* Key Outcomes Preview */}
                {Array.isArray(course.keyOutcomes) && course.keyOutcomes.length > 0 && (
                  <div className="mt-3">
                    <h5 className="text-xs font-semibold text-gray-700 mb-2">Key Outcomes:</h5>
                    <ul className="space-y-1 max-w-2xl">
                      {course.keyOutcomes.slice(0, 3).map((outcome: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0 mt-2"></div>
                          <span className="text-sm text-gray-700 leading-relaxed">{outcome}</span>
                        </li>
                      ))}
                      {course.keyOutcomes.length > 3 && (
                        <li className="text-xs text-gray-500 italic ml-3.5">
                          +{course.keyOutcomes.length - 3} more outcomes...
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>

              {/* Right: Price and Actions */}
              <div className="flex flex-row sm:flex-col items-center sm:items-end gap-4 sm:gap-3 flex-shrink-0">
                
                {/* Price */}
                <div className="text-right">
                  <div className="text-xl sm:text-2xl font-bold text-gray-900">
                    {course.price ? (
                      `₹${Number(course.price).toLocaleString()}`
                    ) : (
                      <span className="text-green-600">Free</span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row lg:flex-col gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setEditing(prev => !prev)}
                    className="px-4 py-2 border-2 border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-200 text-sm font-medium whitespace-nowrap"
                  >
                    {editing ? "Close" : "Edit"}
                  </button>
                  
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl whitespace-nowrap"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      {editing && (
        <div className="border-t border-indigo-100 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 p-4 sm:p-6">
          <div className="mb-4">
            <h5 className="text-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Edit Course
            </h5>
            <p className="text-sm text-gray-600 mt-1">
              Make changes to your course details below.
            </p>
          </div>
          
          <AdminCourseForm
            initialData={{
              ...course,
              slug: course.slug ?? ""
            }}
            onSaved={handleSaved}
          />
        </div>
      )}
    </div>
  );
}