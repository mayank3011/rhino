// components/Navbar.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";


type User = {
  id?: string;
  name?: string;
  email?: string;
  role?: string;      // sometimes single role
  roles?: string[];   // sometimes array of roles
  avatar?: string | null;
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

  // helper - returns true when the user has admin role (string or array)
  function isAdmin(u: User | null) {
    if (!u) return false;
    if (typeof u.role === "string") {
      if (u.role.toLowerCase() === "admin") return true;
    }
    if (Array.isArray(u.roles)) {
      if (u.roles.map((r) => String(r).toLowerCase()).includes("admin")) return true;
    }
    // some backends use `roles` as object or `isAdmin` flag - check common variants:
    // @ts-ignore
    if ((u as any).isAdmin === true) return true;
    return false;
  }

  useEffect(() => {
    let mounted = true;
    setLoadingUser(true);
    fetch("/api/auth/me")
      .then((r) => {
        if (!mounted) return null;
        if (!r.ok) return null;
        return r.json().catch(() => null);
      })
      .then((d) => {
        if (!mounted) return;
        // backend might return { user: { ... } } or the user object directly
        const u = d?.user ?? d ?? null;
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

  // close dropdowns on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (learnRef.current && !learnRef.current.contains(e.target as Node)) setLearnOpen(false);
    }
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      // ignore
    } finally {
      setUser(null);
      router.push("/");
    }
  }

  // brand / styles (adjust to your palette)
  const BRAND = {
  title: "RhinoGeeks",
  logoUrl: "/rhino-logo.png", // <-- put your file into public/
  primaryGradient: "linear-gradient(135deg,#7c4dff 0%,#4f46e5 100%)",
  primaryColor: "#4f46e5",
  accentColor: "#16a34a",
};


  return (
    <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* LEFT */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3">
              <Image src={BRAND.logoUrl} alt={BRAND.title} width={150} height={150} className="object-cover" />
            </Link>
          </div>

          {/* CENTER (desktop) */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-800">
            <div className="relative" ref={learnRef}>
              <button
                onClick={() => setLearnOpen((s) => !s)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-gray-100"
                aria-expanded={learnOpen}
              >
                Learn
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                  <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.25 8.29a.75.75 0 01-.02-1.08z" />
                </svg>
              </button>
              {learnOpen && (
                <div className="absolute left-0 mt-2 w-48 bg-white border rounded-md shadow-lg py-2 z-30">
                  <Link href="/courses" className="block px-4 py-2 text-sm hover:bg-gray-100">All Courses</Link>
                  <Link href="/workshops" className="block px-4 py-2 text-sm hover:bg-gray-100">Workshops</Link>
                  <Link href="/mentorship" className="block px-4 py-2 text-sm hover:bg-gray-100">Mentorship</Link>
                </div>
              )}
            </div>

            <Link href="/teams" className="hover:text-emerald-700">Upskill your Team</Link>
            <Link href="/about" className="hover:text-emerald-700">About</Link>
          </nav>

          {/* RIGHT */}
          <div className="flex items-center gap-3">
            {/* Admin button: visible when isAdmin(user) is true */}
            {isAdmin(user) && (
              <Link
                href="/admin"
                className="hidden md:inline-block px-3 py-1.5 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700"
              >
                Admin Panel
              </Link>
            )}

            {/* profile/login (desktop) */}
            <div className="hidden md:flex items-center gap-2">
              {loadingUser ? (
                <div className="px-3 py-1 text-sm text-slate-500">Checking...</div>
              ) : user ? (
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setProfileOpen((s) => !s)}
                    className="flex items-center gap-2 px-3 py-1.5 border rounded-md hover:bg-gray-100"
                    aria-expanded={profileOpen}
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                      {user.name?.slice(0, 1).toUpperCase() || user.email?.slice(0, 1).toUpperCase() || "U"}
                    </div>
                    <span className="text-sm text-gray-900">{user.name ?? user.email}</span>
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border rounded-md shadow-lg z-40">
                      <div className="p-3 border-b text-sm text-gray-900">
                        <div className="font-medium">{user.name ?? user.email}</div>
                        <div className="text-xs text-slate-600">{Array.isArray(user.roles) ? user.roles.join(", ") : user.role}</div>
                      </div>
                      <Link href="/profile" className="block px-3 py-2 text-sm hover:bg-gray-100">Profile</Link>
                      <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100">Logout</button>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/login" className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-100">Login</Link>
              )}
              {!user && (
                <Link href="/apply-mentor" className="px-3 py-1.5 border border-emerald-700 text-emerald-700 rounded text-sm hover:bg-emerald-700 hover:text-white transition">
                  Apply as Mentor
                </Link>
              )}
            </div>

            {/* Register CTA desktop */}
            <Link href="/register" className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded text-white text-sm" style={{ backgroundColor: BRAND.accent }}>
              Register
            </Link>

            {/* Mobile toggle */}
            <button onClick={() => setMobileOpen((s) => !s)} className="md:hidden p-2 rounded-md hover:bg-gray-100" aria-label="Toggle menu">
              {mobileOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
              )}
            </button>
          </div>
        </div>

        {/* MOBILE MENU */}
        {mobileOpen && (
          <nav className="md:hidden border-t py-4 space-y-2 text-gray-800">
            <Link href="/courses" className="block px-2 py-2 hover:bg-gray-100">Learn</Link>
            <Link href="/teams" className="block px-2 py-2 hover:bg-gray-100">Upskill your Team</Link>
            <Link href="/about" className="block px-2 py-2 hover:bg-gray-100">About</Link>

            {/* Admin mobile */}
            {isAdmin(user) && (
              <Link href="/admin" className="block px-2 py-2 rounded bg-indigo-600 text-white font-medium hover:bg-indigo-700">Admin Panel</Link>
            )}

            {user ? (
              <>
                <div className="px-2 py-2 border-t">
                  <div className="text-sm font-medium">{user.name ?? user.email}</div>
                  <div className="text-xs text-slate-600">{Array.isArray(user.roles) ? user.roles.join(", ") : user.role}</div>
                </div>
                <button onClick={handleLogout} className="w-full text-left px-2 py-2 hover:bg-gray-100">Logout</button>
              </>
            ) : (
              <>
                <Link href="/login" className="block px-2 py-2 hover:bg-gray-100">Login</Link>
                <Link href="/apply-mentor" className="block px-2 py-2 border border-emerald-700 text-emerald-700 rounded text-center hover:bg-emerald-700 hover:text-white transition">Apply as Mentor</Link>
              </>
            )}

            <div className="px-2">
              <Link href="/register" className="block text-center px-3 py-2 rounded text-white" style={{ backgroundColor: BRAND.accent }}>Register</Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
