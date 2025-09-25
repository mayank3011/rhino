// components/Navbar.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";

// --- Constants based on Logo Colors ---
const COLOR_PRIMARY = "indigo-600"; // #4f46e5
const COLOR_ACCENT = "emerald-600"; // Keeping the original accent color for high-visibility CTAs (Apply/Register)

type User = {
  id?: string;
  name?: string;
  email?: string;
  role?: string;      // sometimes single role
  roles?: string[];   // sometimes array of roles
  avatar?: string | null;
};

// Define a type for potential extra backend flags that require assertion
type UserWithFlags = User & {
  isAdmin?: boolean;
};

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [learnOpen, setLearnOpen] = useState(false);

  const router = useRouter();
  const profileRef = useRef<HTMLDivElement | null>(null);
  const learnRef = useRef<HTMLDivElement | null>(null);

  // Helper - returns true when the user has admin role (string or array)
  function isAdmin(u: User | null): boolean {
    if (!u) return false;

    // Check role/roles array
    if (typeof u.role === "string" && u.role.toLowerCase() === "admin") return true;
    if (Array.isArray(u.roles) && u.roles.map((r) => String(r).toLowerCase()).includes("admin")) return true;

    if ((u as UserWithFlags).isAdmin === true) return true;

    return false;
  }

  // Fetch user profile on mount
  useEffect(() => {
    let mounted = true;
    setLoadingUser(true);
    fetch("/api/auth/me")
      .then((r) => {
        if (!mounted || !r.ok) return null;
        return r.json().catch(() => null);
      })
      .then((d) => {
        if (!mounted) return;
        // The d is of type 'unknown' after catch, safely checking structure
        const u = (d as { user?: User })?.user ?? (d as User) ?? null;
        setUser(u);
      })
      .catch(() => setUser(null))
      .finally(() => {
        if (mounted) setLoadingUser(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (learnRef.current && !learnRef.current.contains(e.target as Node)) setLearnOpen(false);
    }
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  // FIXED: Removed the unused parameter from the function signature.
  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      // ignore
      console.error("Logout error:", e);
      return;
    } finally {
      setUser(null);
      router.push("/");
    }
  }

  // brand / styles (adjust to your palette)
  const BRAND = {
    title: "RhinoGeeks",
    logoUrl: "/rhino-logo.png", // Assuming logo is placed in public/ and is the file user provided
    primaryColorClass: `text-${COLOR_PRIMARY}`,
    accentColorClass: `bg-${COLOR_ACCENT} hover:bg-emerald-700`,
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20"> {/* Increased height for better logo fit */}
          {/* LEFT: Logo */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3">
              <Image 
                src={BRAND.logoUrl} 
                alt={BRAND.title} 
                width={200} 
                height={50} 
                priority
                className="w-auto h-8 sm:h-10 object-contain" 
              />
            </Link>
          </div>

          {/* CENTER (desktop) */}
          <nav className="hidden md:flex items-center gap-8 text-base font-medium text-gray-700">
            {/* Learn Dropdown */}
            <div className="relative" ref={learnRef}>
              <button
                onClick={() => setLearnOpen((s) => !s)}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md hover:text-${COLOR_PRIMARY} transition-colors`}
                aria-expanded={learnOpen}
              >
                Learn
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                  <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.25 8.29a.75.75 0 01-.02-1.08z" />
                </svg>
              </button>
              {learnOpen && (
                <div className="absolute left-0 mt-2 w-48 bg-white border border-slate-100 rounded-lg shadow-xl py-2 z-30">
                  <Link href="/courses" className="block px-4 py-2 text-sm text-gray-800 hover:bg-slate-50">All Courses</Link>
                  {/* <Link href="/workshops" className="block px-4 py-2 text-sm text-gray-800 hover:bg-slate-50">Workshops</Link>
                  <Link href="/mentorship" className="block px-4 py-2 text-sm text-gray-800 hover:bg-slate-50">Mentorship</Link> */}
                </div>
              )}
            </div>

            <Link href="/about" className={`hover:text-${COLOR_PRIMARY} transition-colors`}>About Us</Link>
            <Link href="/contact" className={`hover:text-${COLOR_PRIMARY} transition-colors`}>Contact</Link>
          </nav>

          {/* RIGHT: Buttons and Profile */}
          <div className="flex items-center gap-3">
            {/* Admin button */}
            {isAdmin(user) && (
              <Link
                href="/admin"
                className={`hidden md:inline-block px-3 py-1.5 rounded-lg bg-${COLOR_PRIMARY} text-white text-sm font-medium hover:bg-indigo-700 transition-colors`}
              >
                Admin Panel
              </Link>
            )}

            {/* Profile/Login (desktop) */}
            <div className="hidden md:flex items-center gap-2">
              {loadingUser ? (
                <div className="px-3 py-1 text-sm text-slate-500">Loading...</div>
              ) : user ? (
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setProfileOpen((s) => !s)}
                    className="flex items-center gap-2 px-3 py-1.5 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                    aria-expanded={profileOpen}
                  >
                    <div className={`w-8 h-8 rounded-full bg-${COLOR_PRIMARY}/10 flex items-center justify-center text-sm font-medium text-${COLOR_PRIMARY}`}>
                      {user.avatar ? (
                          <Image src={user.avatar} alt="Avatar" width={32} height={32} className="w-full h-full rounded-full object-cover" />
                      ) : (
                          user.name?.slice(0, 1).toUpperCase() || user.email?.slice(0, 1).toUpperCase() || "U"
                      )}
                    </div>
                    <span className="text-sm text-gray-900 font-medium hidden lg:inline">{user.name ?? user.email}</span>
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-lg shadow-xl py-2 z-40">
                      <div className="p-3 border-b border-slate-100 text-sm text-gray-900">
                        <div className="font-semibold">{user.name ?? user.email}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{Array.isArray(user.roles) ? user.roles.join(", ") : user.role ?? 'User'}</div>
                      </div>
                      <Link href="/profile" className="block px-3 py-2 text-sm hover:bg-slate-50">👤 Profile & Courses</Link>
                      <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50">➡️ Logout</button>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/login" className={`px-4 py-1.5 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors`}>Login</Link>
              )}
              
              {/* Mentor Apply CTA (visible only if not logged in) */}
              {!user && (
                <Link 
                  href="/apply-mentor" 
                  className={`px-3 py-1.5 border border-${COLOR_ACCENT} text-${COLOR_ACCENT} rounded-lg text-sm font-medium hover:bg-${COLOR_ACCENT} hover:text-white transition-colors`}
                >
                  Apply as Mentor
                </Link>
              )}
            </div>

            {/* Register CTA (desktop) */}
            <Link 
              href="/register" 
              className={`hidden md:inline-flex items-center px-4 py-2 rounded-lg text-white font-medium text-base ${BRAND.accentColorClass} transition-colors`}
            >
              Start Learning
            </Link>

            {/* Mobile toggle */}
            <button onClick={() => setMobileOpen((s) => !s)} className={`md:hidden p-2 rounded-lg hover:bg-gray-100 text-${COLOR_PRIMARY}`} aria-label="Toggle menu">
              {mobileOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
              )}
            </button>
          </div>
        </div>

        {/* MOBILE MENU (Responsive Dropdown) */}
        {mobileOpen && (
          <nav className="md:hidden border-t border-slate-100 py-4 space-y-2 text-gray-700 transition-all duration-300">
            <Link href="/courses" className="block px-3 py-2 font-medium hover:bg-slate-50">📖 All Courses</Link>
            <Link href="/teams" className="block px-3 py-2 font-medium hover:bg-slate-50">👥 Upskill your Team</Link>
            <Link href="/about" className="block px-3 py-2 font-medium hover:bg-slate-50">ℹ️ About Us</Link>
            <Link href="/contact" className="block px-3 py-2 font-medium hover:bg-slate-50">📞 Contact</Link>

            {/* Admin mobile */}
            {isAdmin(user) && (
              <Link href="/admin" className={`block px-3 py-2 rounded text-white font-medium bg-${COLOR_PRIMARY} hover:bg-indigo-700 transition-colors mt-2`}>⚙️ Admin Panel</Link>
            )}

            {/* User/Login mobile */}
            {user ? (
              <div className="mt-4 border-t border-slate-100 pt-3">
                <div className="px-3 py-2">
                  <div className="text-sm font-semibold text-gray-900">{user.name ?? user.email}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{Array.isArray(user.roles) ? user.roles.join(", ") : user.role ?? 'User'}</div>
                </div>
                <Link href="/profile" className="block px-3 py-2 hover:bg-slate-50">Profile</Link>
                <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50">Logout</button>
              </div>
            ) : (
              <div className="mt-4 border-t border-slate-100 pt-3 flex flex-col gap-2 px-3">
                <Link href="/login" className={`block text-center px-3 py-2 border rounded-lg text-sm font-medium hover:bg-slate-50`}>Login</Link>
                <Link href="/apply-mentor" className={`block text-center px-3 py-2 border border-${COLOR_ACCENT} text-${COLOR_ACCENT} rounded-lg text-sm font-medium hover:bg-${COLOR_ACCENT} hover:text-white transition-colors`}>Apply as Mentor</Link>
                <Link href="/register" className={`block text-center px-3 py-2 rounded-lg text-white font-medium ${BRAND.accentColorClass}`}>Start Learning</Link>
              </div>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}