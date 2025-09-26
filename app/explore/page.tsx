// app/explore/page.tsx
import React from "react";
import Link from "next/link";
import CourseCard from "@/components/CourseCard";

// ---------- Types ----------
interface FeaturedCard {
  _id: string;
  title: string;
  slug?: string;
  excerpt: string;
  duration?: string;
  price: number;
  image?: string;
  mentors: { id: string; name?: string; avatar?: string }[];
  category?: string;
}

// ---------- Mock Data ----------
const mockCourses: FeaturedCard[] = [
  {
    _id: "1",
    title: "Complete React Developer Course",
    slug: "complete-react-developer",
    excerpt: "Master React from fundamentals to advanced patterns. Build real-world projects including e-commerce apps, dashboards, and more with hooks, context, and modern React features.",
    duration: "8 weeks",
    price: 15999,
    image: "/og-image.png",
    mentors: [
      {
        id: "mentor-1",
        name: "Sarah Johnson",
        avatar: "/logo.png"
      }
    ],
    category: "Frontend Development"
  },
  {
    _id: "2", 
    title: "Node.js & Express Masterclass",
    slug: "nodejs-express-masterclass",
    excerpt: "Build scalable backend applications with Node.js and Express. Learn MongoDB, authentication, RESTful APIs, middleware, and deployment strategies.",
    duration: "6 weeks",
    price: 12999,
    image: "/og-image.png",
    mentors: [
      {
        id: "mentor-2",
        name: "Mike Chen",
        avatar: "/logo.png"
      },
      {
        id: "mentor-3", 
        name: "Alex Rodriguez",
        avatar: "/logo.png"
      }
    ],
    category: "Backend Development"
  },
  {
    _id: "3",
    title: "Data Science with Python",
    slug: "data-science-python",
    excerpt: "Comprehensive data science course covering NumPy, Pandas, Matplotlib, machine learning with scikit-learn, and real-world data analysis projects.",
    duration: "10 weeks",
    price: 18999,
    image: "/og-image.png",
    mentors: [
      {
        id: "mentor-4",
        name: "Dr. Priya Sharma",
        avatar: "/logo.png"
      }
    ],
    category: "Data Science"
  },
  {
    _id: "4",
    title: "UI/UX Design Fundamentals",
    slug: "ui-ux-design-fundamentals", 
    excerpt: "Learn design thinking, user research, wireframing, prototyping with Figma, and create stunning user interfaces that convert and engage users.",
    duration: "5 weeks",
    price: 9999,
    image: "/og-image.png",
    mentors: [
      {
        id: "mentor-5",
        name: "Emma Wilson",
        avatar: "/logo.png"
      }
    ],
    category: "Design"
  },
  {
    _id: "5",
    title: "Full-Stack JavaScript Development",
    slug: "fullstack-javascript",
    excerpt: "Complete full-stack development with MERN stack. Build and deploy production-ready applications with React, Node.js, MongoDB, and modern tools.",
    duration: "12 weeks", 
    price: 24999,
    image: "/og-image.png",
    mentors: [
      {
        id: "mentor-1",
        name: "Sarah Johnson", 
        avatar: "/logo.png"
      },
      {
        id: "mentor-2",
        name: "Mike Chen",
        avatar: "/logo.png"
      }
    ],
    category: "Full-Stack Development"
  },
  {
    _id: "6",
    title: "Cloud Computing with AWS",
    slug: "aws-cloud-computing",
    excerpt: "Master AWS services including EC2, S3, Lambda, RDS, and CloudFormation. Learn to architect, deploy, and scale cloud applications effectively.",
    duration: "8 weeks",
    price: 16999,
    image: "/og-image.png", 
    mentors: [
      {
        id: "mentor-6",
        name: "David Kumar",
        avatar: "/logo.png"
      }
    ],
    category: "Cloud Computing"
  },
  {
    _id: "7",
    title: "Mobile App Development with Flutter",
    slug: "flutter-mobile-development",
    excerpt: "Build cross-platform mobile apps with Flutter and Dart. Create beautiful, native-performance apps for iOS and Android from a single codebase.",
    duration: "7 weeks",
    price: 14999,
    image: "/og-image.png",
    mentors: [
      {
        id: "mentor-7", 
        name: "Lisa Park",
        avatar: "/logo.png"
      }
    ],
    category: "Mobile Development"
  },
  {
    _id: "8",
    title: "Cybersecurity Essentials",
    slug: "cybersecurity-essentials",
    excerpt: "Learn ethical hacking, network security, penetration testing, and security best practices. Protect applications and infrastructure from modern threats.",
    duration: "9 weeks",
    price: 19999,
    image: "/og-image.png",
    mentors: [
      {
        id: "mentor-8",
        name: "James Thompson", 
        avatar: "/logo.png"
      }
    ],
    category: "Cybersecurity"
  },
  {
    _id: "9",
    title: "Machine Learning Fundamentals", 
    slug: "machine-learning-fundamentals",
    excerpt: "Introduction to machine learning algorithms, supervised and unsupervised learning, neural networks, and practical ML project implementation.",
    duration: "11 weeks",
    price: 21999,
    image: "/og-image.png",
    mentors: [
      {
        id: "mentor-4",
        name: "Dr. Priya Sharma",
        avatar: "/logo.png"
      },
      {
        id: "mentor-9",
        name: "Robert Lee",
        avatar: "/logo.png"
      }
    ],
    category: "Machine Learning"
  }
];

// ---------- Page ----------
export const revalidate = 0;

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  // Simulate database query with mock data
  const docs = mockCourses;
  const total = docs.length;

  // Get search query for filtering
  const searchQuery = searchParams.q as string || "";
  
  // Simple client-side filtering for demo
  const filteredDocs = searchQuery 
    ? docs.filter(course => 
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.category?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : docs;

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Explore Courses</h1>
        <p className="mt-2 text-slate-600">
          Discover our comprehensive programming courses designed by industry experts to advance your career.
        </p>
      </div>

      {/* Simple Search */}
      <div className="bg-white rounded-xl border shadow-sm p-4 md:p-5 mb-8">
        <form
          action="/explore"
          method="get"
          className="flex flex-col sm:flex-row gap-4 items-end"
        >
          <div className="flex-1">
            <label className="block text-sm text-slate-600 mb-1">Search Courses</label>
            <input
              type="text"
              name="q"
              defaultValue={searchQuery}
              placeholder="e.g. React, Python, Data Science..."
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="flex gap-2">
            <button 
              type="submit"
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
            >
              Search
            </button>
            <Link
              href="/explore"
              className="px-6 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors font-medium"
            >
              Clear
            </Link>
          </div>
        </form>
      </div>

      {/* Results */}
      <div className="mb-6 flex items-center justify-between">
        <div className="text-sm text-slate-600">
          Showing <span className="font-medium">{filteredDocs.length}</span> of{" "}
          <span className="font-medium">{total}</span> courses
          {searchQuery && (
            <span className="ml-2 px-2 py-1 bg-emerald-100 text-emerald-800 rounded-md text-xs">
              Results for &ldquo;{searchQuery}&rdquo;
            </span>
          )}
        </div>
        <div className="text-sm text-slate-500">
          All courses include lifetime access & certificates
        </div>
      </div>

      {filteredDocs.length === 0 ? (
        <div className="p-12 bg-white border rounded-xl text-center">
          <div className="max-w-md mx-auto">
            <div className="h-16 w-16 mx-auto mb-4 rounded-xl bg-slate-100 flex items-center justify-center">
              <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No courses found</h3>
            <p className="text-slate-600 mb-4">
              Try adjusting your search terms or browse all available courses.
            </p>
            <Link 
              href="/explore"
              className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              View All Courses
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredDocs.map((course) => (
            <CourseCard key={course._id} course={course} />
          ))}
        </div>
      )}

      {/* Course Categories Section */}
      <div className="mt-16 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">
          Popular Course Categories
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: "Frontend Development", count: 3, icon: "🎨" },
            { name: "Backend Development", count: 2, icon: "⚙️" },
            { name: "Data Science", count: 2, icon: "📊" },
            { name: "Mobile Development", count: 1, icon: "📱" },
            { name: "Cloud Computing", count: 1, icon: "☁️" },
            { name: "Cybersecurity", count: 1, icon: "🔒" },
            { name: "Machine Learning", count: 1, icon: "🤖" },
            { name: "Design", count: 1, icon: "✨" }
          ].map((category) => (
            <div
              key={category.name}
              className="bg-white rounded-xl p-4 text-center hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="text-2xl mb-2">{category.icon}</div>
              <h3 className="font-semibold text-slate-900 text-sm">{category.name}</h3>
              <p className="text-xs text-slate-600 mt-1">{category.count} courses</p>
            </div>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="mt-16 bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-800 rounded-2xl p-8 text-white text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">
          Ready to Start Your Learning Journey?
        </h2>
        <p className="text-indigo-200 mb-6 max-w-2xl mx-auto">
          Join over 10,000 students who have transformed their careers with our expert-led courses. 
          Start with any course and get immediate access to premium content.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="inline-flex items-center justify-center px-8 py-3 bg-white text-indigo-900 rounded-xl font-semibold hover:bg-indigo-50 transition-colors"
          >
            Start Learning Today
          </Link>
          <Link
            href="/about"
            className="inline-flex items-center justify-center px-8 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
          >
            Learn More About Us
          </Link>
        </div>
      </div>

      {/* Brands strip */}
      <div className="mt-16 bg-slate-50 rounded-xl border p-6">
        <h3 className="text-center text-slate-800 font-semibold mb-6">Our graduates work at</h3>
        <div className="flex items-center justify-center flex-wrap gap-8 opacity-70">
          {["Google", "Amazon", "Microsoft", "Netflix", "Spotify", "Uber"].map((company) => (
            <div key={company} className="text-slate-600 font-medium text-lg">
              {company}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}