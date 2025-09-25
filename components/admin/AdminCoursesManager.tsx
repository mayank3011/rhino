// components/admin/AdminCoursesManager.tsx
"use client";

import React, { JSX } from "react";
import useSWR from "swr";
import Link from "next/link";
import fetcher from "../../utils/fetcher";
import AdminCourseItem from "./AdminCourseItem";

// Types for better type safety
interface Course {
  _id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  image: string;
  published: boolean;
  category: string;
  createdAt: string;
  updatedAt: string;
}


export default function AdminCoursesManager(): JSX.Element {
  const { data, error, isLoading, mutate } = useSWR<Course[]>(
    "/api/admin/courses", 
    fetcher, 
    { revalidateOnFocus: false }
  );

  const courses: Course[] = data || [];

  React.useEffect(() => {
    if (!isLoading && !error && courses.length > 0) {
      console.log("AdminCoursesManager loaded", courses.length, "courses");
    }
  }, [isLoading, error, courses.length]);

  const handleRefresh = (): void => {
    mutate();
  };

  const publishedCount = courses.filter(course => course.published).length;
  const draftCount = courses.filter(course => !course.published).length;

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
        <div className="text-red-600 font-medium">Failed to load courses</div>
        <p className="text-red-500 text-sm mt-1">Please try refreshing the page</p>
        <button 
          onClick={handleRefresh}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg border border-purple-100 p-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Course Management
              </h1>
              <p className="text-gray-600 mt-2">Create, edit, and manage your courses</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
              <Link 
                href="/course/create" 
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl text-center"
              >
                + Create New Course
              </Link>
              <button 
                onClick={handleRefresh}
                disabled={isLoading}
                className="px-6 py-3 border-2 border-purple-200 text-purple-700 rounded-lg hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
              >
                {isLoading ? "Loading..." : "Refresh"}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-lg border border-purple-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Courses</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{courses.length}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-green-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Published</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{publishedCount}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-yellow-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Drafts</p>
                <p className="text-3xl font-bold text-yellow-600 mt-1">{draftCount}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Courses List */}
        <div className="bg-white rounded-xl shadow-lg border border-purple-100 p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">All Courses</h2>
              <p className="text-gray-600 text-sm mt-1">
                Manage your course content and settings
              </p>
            </div>
            
            {courses.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full">
                  {publishedCount} Published
                </span>
                <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                  {draftCount} Draft
                </span>
              </div>
            )}
          </div>

          <div>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-4"></div>
                <p className="text-gray-600">Loading courses...</p>
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-6">📚</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Get started by creating your first course. You can add content, set pricing, and publish when ready.
                </p>
                <Link 
                  href="/course/create"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Your First Course
                </Link>
              </div>
            ) : (
              <div className="grid gap-4">
                {courses.map((course) => (
                  <AdminCourseItem key={course._id} course={course} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        {courses.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-purple-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <button className="p-4 border-2 border-purple-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-all duration-200 text-left">
                <h4 className="font-medium text-purple-700 mb-1">Bulk Edit</h4>
                <p className="text-sm text-gray-600">Edit multiple courses at once</p>
              </button>
              
              <button className="p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 text-left">
                <h4 className="font-medium text-blue-700 mb-1">Export Data</h4>
                <p className="text-sm text-gray-600">Download course information</p>
              </button>
              
              <button className="p-4 border-2 border-green-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-all duration-200 text-left">
                <h4 className="font-medium text-green-700 mb-1">Analytics</h4>
                <p className="text-sm text-gray-600">View course performance</p>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}