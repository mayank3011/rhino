"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type User = { id?: string; name?: string; email?: string; role?: string };

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [learnOpen, setLearnOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!mounted) return;
        setUser(d?.user ?? null);
      })
      .catch(() => setUser(null));
    return () => {
      mounted = false;
    };
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* LEFT: Logo */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-700 rounded-full flex items-center justify-center text-white font-bold">
                GS
              </div>
              <span className="font-semibold text-gray-900 text-lg hidden sm:block">
                Growth School
              </span>
            </Link>
          </div>

          {/* CENTER: Nav (desktop) */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-800">
            {/* Learn dropdown */}
            <div className="relative">
              <button
                onClick={() => setLearnOpen((s) => !s)}
                onBlur={() => setTimeout(() => setLearnOpen(false), 150)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-gray-100"
              >
                Learn
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.25 8.29a.75.75 0 01-.02-1.08z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              {learnOpen && (
                <div className="absolute left-0 mt-2 w-48 bg-white border rounded-md shadow-lg py-2 z-30">
                  <Link
                    href="/courses"
                    className="block px-4 py-2 text-sm hover:bg-gray-100 text-gray-800"
                  >
                    All Courses
                  </Link>
                  <Link
                    href="/workshops"
                    className="block px-4 py-2 text-sm hover:bg-gray-100 text-gray-800"
                  >
                    Workshops
                  </Link>
                  <Link
                    href="/mentorship"
                    className="block px-4 py-2 text-sm hover:bg-gray-100 text-gray-800"
                  >
                    Mentorship
                  </Link>
                </div>
              )}
            </div>
            <Link href="/teams" className="hover:text-emerald-700">
              Upskill your Team
            </Link>
            <Link href="/about" className="hover:text-emerald-700">
              About
            </Link>
          </nav>

          {/* RIGHT: Actions */}
          <div className="flex items-center gap-3">
            {/* Admin shortcut */}
            {user?.role === "admin" && (
              <Link
                href="/admin"
                className="hidden md:inline-block px-3 py-1.5 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700"
              >
                Admin Panel
              </Link>
            )}

            {/* Profile or Login (desktop) */}
            <div className="hidden md:flex items-center gap-2">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen((s) => !s)}
                    className="flex items-center gap-2 px-3 py-1.5 border rounded-md hover:bg-gray-100"
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                      {user.name?.slice(0, 1).toUpperCase() ||
                        user.email?.slice(0, 1).toUpperCase()}
                    </div>
                    <span className="text-sm text-gray-900">
                      {user.name ?? user.email}
                    </span>
                  </button>
                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border rounded-md shadow-lg z-40">
                      <div className="p-3 border-b text-sm text-gray-900">
                        <div className="font-medium">
                          {user.name ?? user.email}
                        </div>
                        <div className="text-xs text-slate-600">{user.role}</div>
                      </div>
                      <Link
                        href="/profile"
                        className="block px-3 py-2 text-sm hover:bg-gray-100 text-gray-800"
                      >
                        Profile
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 text-gray-800"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-100 text-gray-800"
                >
                  Login
                </Link>
              )}
              {!user && (
                <Link
                  href="/apply-mentor"
                  className="px-3 py-1.5 border border-emerald-700 text-emerald-700 rounded text-sm hover:bg-emerald-700 hover:text-white transition"
                >
                  Apply as Mentor
                </Link>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen((s) => !s)}
              className="md:hidden p-2 rounded-md hover:bg-gray-100"
            >
              {mobileOpen ? (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* MOBILE MENU */}
        {mobileOpen && (
          <nav className="md:hidden border-t py-4 space-y-2 text-gray-800">
            <Link href="/courses" className="block px-2 py-2 hover:bg-gray-100">
              Learn
            </Link>
            <Link href="/teams" className="block px-2 py-2 hover:bg-gray-100">
              Upskill your Team
            </Link>
            <Link href="/about" className="block px-2 py-2 hover:bg-gray-100">
              About
            </Link>

            {user?.role === "admin" && (
              <Link
                href="/admin"
                className="block px-2 py-2 rounded bg-indigo-600 text-white font-medium hover:bg-indigo-700"
              >
                Admin Panel
              </Link>
            )}

            {user ? (
              <>
                <div className="px-2 py-2 border-t text-gray-900">
                  <div className="text-sm font-medium">
                    {user.name ?? user.email}
                  </div>
                  <div className="text-xs text-slate-600">{user.role}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-2 py-2 hover:bg-gray-100 text-gray-800"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="block px-2 py-2 hover:bg-gray-100 text-gray-800"
                >
                  Login
                </Link>
                <Link
                  href="/apply-mentor"
                  className="block px-2 py-2 border border-emerald-700 text-emerald-700 rounded text-center hover:bg-emerald-700 hover:text-white transition"
                >
                  Apply as Mentor
                </Link>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
