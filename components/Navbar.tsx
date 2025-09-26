"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";

// Types
interface User {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  roles?: string[];
  avatar?: string | null;
}

interface BrandConfig {
  title: string;
  logoUrl: string;
  logoUrlMobile: string; // New: Mobile logo URL
  primaryGradient: string;
  primaryColor: string;
  accentColor: string;
}

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [learnOpen, setLearnOpen] = useState(false);

  const router = useRouter();
  const profileRef = useRef<HTMLDivElement | null>(null);
  const learnRef = useRef<HTMLDivElement | null>(null);

  // Brand configuration with RhinoGeeks colors
  const BRAND: BrandConfig = {
    title: "RhinoGeeks",
    logoUrl: "/rhino-logo.png",
    logoUrlMobile: "/rhino-logo-mobile.png", // Placeholder for the mobile logo
    primaryGradient: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #3b82f6 100%)",
    primaryColor: "#6366f1",
    accentColor: "#10b981",
  };

  // Helper - returns true when the user has admin role
  function isAdmin(userObj: User | null): boolean {
    if (!userObj) return false;
    
    if (typeof userObj.role === "string") {
      if (userObj.role.toLowerCase() === "admin") return true;
    }
    
    if (Array.isArray(userObj.roles)) {
      if (userObj.roles.map((r) => String(r).toLowerCase()).includes("admin")) return true;
    }
    
    // Check common variants
    const userWithAdmin = userObj as User & { isAdmin?: boolean };
    if (userWithAdmin.isAdmin === true) return true;
    
    return false;
  }

  // Fetch user data
  useEffect(() => {
    let mounted = true;
    setLoadingUser(true);
    
    fetch("/api/auth/me")
      .then((response) => {
        if (!mounted) return null;
        if (!response.ok) return null;
        return response.json().catch(() => null);
      })
      .then((data) => {
        if (!mounted) return;
        // The fix is here: Ensure that the user data is a valid object with an ID.
        // This prevents the UI from showing "U" when the API returns an empty object.
        const userPayload = data?.user ?? data;
        if (userPayload && userPayload.id) {
          setUser(userPayload);
        } else {
          setUser(null);
        }
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
    function handleClickOutside(event: MouseEvent): void {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
      if (learnRef.current && !learnRef.current.contains(event.target as Node)) {
        setLearnOpen(false);
      }
    }
    
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Close mobile menu on escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setMobileOpen(false);
        setProfileOpen(false);
        setLearnOpen(false);
      }
    }
    
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  async function handleLogout(): Promise<void> {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      router.push("/");
    }
  }

  return (
    <header className="sticky top-0 z-50 max-w-full bg-white/95 backdrop-blur-sm border-b border-indigo-100 shadow-sm">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity duration-200">
              {/* Desktop Logo: visible on lg and above */}
              <div className="relative w-45 h-45 flex-shrink-0 hidden lg:block">
                <Image 
                  src={BRAND.logoUrl} 
                  alt={BRAND.title} 
                  fill
                  className="object-contain" 
                  priority
                />
              </div>
              
              {/* Mobile Logo: hidden on lg and above */}
              <div className="relative w-10 h-10 flex-shrink-0 lg:hidden">
                <Image 
                  src={BRAND.logoUrlMobile} 
                  alt={BRAND.title} 
                  fill
                  className="object-contain" 
                  priority
                />
              </div>
              
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-gray-700">
            
            {/* Learn Dropdown */}
            <div className="relative" ref={learnRef}>
              <button
                onClick={() => setLearnOpen(!learnOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 transition-all duration-200"
                aria-expanded={learnOpen}
              >
                Learn
                <svg 
                  className={`w-4 h-4 transition-transform duration-200 ${learnOpen ? 'rotate-180' : ''}`} 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.25 8.29a.75.75 0 01-.02-1.08z" clipRule="evenodd" />
                </svg>
              </button>
              
              {learnOpen && (
                <div className="absolute left-0 mt-2 w-56 bg-white border border-indigo-100 rounded-xl shadow-xl py-3 z-30 animate-in fade-in-0 zoom-in-95 duration-200">
                  <Link href="/courses" className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-indigo-50 hover:text-indigo-700 transition-colors duration-200">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                      <span className="text-indigo-600 text-sm">📚</span>
                    </div>
                    <div>
                      <div className="font-medium">All Courses</div>
                      <div className="text-xs text-gray-500">Browse our catalog</div>
                    </div>
                  </Link>
                  <Link href="/workshops" className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-indigo-50 hover:text-indigo-700 transition-colors duration-200">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                      <span className="text-purple-600 text-sm">🛠️</span>
                    </div>
                    <div>
                      <div className="font-medium">Workshops</div>
                      <div className="text-xs text-gray-500">Hands-on sessions</div>
                    </div>
                  </Link>
                  <Link href="/mentorship" className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-indigo-50 hover:text-indigo-700 transition-colors duration-200">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                      <span className="text-blue-600 text-sm">👨‍🏫</span>
                    </div>
                    <div>
                      <div className="font-medium">Mentorship</div>
                      <div className="text-xs text-gray-500">1-on-1 guidance</div>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            <Link 
              href="/teams" 
              className="px-3 py-2 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 transition-all duration-200"
            >
              Upskill your Team
            </Link>
            
            <Link 
              href="/about" 
              className="px-3 py-2 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 transition-all duration-200"
            >
              About
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-4">
            
            {/* Admin Panel Button */}
            {isAdmin(user) && (
              <Link
                href="/admin"
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Admin Panel
              </Link>
            )}

            {/* User Authentication */}
            {loadingUser ? (
              <div className="px-4 py-2 text-sm text-gray-500 animate-pulse">
                Loading...
              </div>
            ) : user ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-3 px-3 py-2 border-2 border-indigo-200 rounded-xl hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-200"
                  aria-expanded={profileOpen}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                    {user.name?.slice(0, 1).toUpperCase() || user.email?.slice(0, 1).toUpperCase() || "U"}
                  </div>
                  <span className="text-sm text-gray-900 font-medium truncate max-w-32">
                    {user.name ?? user.email}
                  </span>
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-indigo-100 rounded-xl shadow-xl z-40 animate-in fade-in-0 zoom-in-95 duration-200">
                    <div className="p-4 border-b border-indigo-100">
                      <div className="font-medium text-gray-900 truncate">
                        {user.name ?? user.email}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {Array.isArray(user.roles) ? user.roles.join(", ") : user.role}
                      </div>
                    </div>
                    <div className="py-2">
                      <Link 
                        href="/profile" 
                        className="block px-4 py-2 text-sm hover:bg-indigo-50 hover:text-indigo-700 transition-colors duration-200"
                      >
                        Profile Settings
                      </Link>
                      <button 
                        onClick={handleLogout} 
                        className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 hover:text-red-700 transition-colors duration-200"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // New: When not logged in, show a single CTA button.
              <Link
                href="/courses"
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Explore our courses
              </Link>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setMobileOpen(!mobileOpen)} 
            className="lg:hidden p-2 rounded-lg hover:bg-indigo-50 transition-colors duration-200" 
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <nav className="lg:hidden border-t border-indigo-100 py-4 bg-white/95 backdrop-blur-sm animate-in slide-in-from-top-2 duration-200">
            <div className="space-y-2">
              
              {/* Mobile Navigation Links */}
              <div className="space-y-1">
                <Link 
                  href="/courses" 
                  className="block px-4 py-3 text-base font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-colors duration-200"
                  onClick={() => setMobileOpen(false)}
                >
                  All Courses
                </Link>
                <Link 
                  href="/workshops" 
                  className="block px-4 py-3 text-base font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-colors duration-200"
                  onClick={() => setMobileOpen(false)}
                >
                  Workshops
                </Link>
                <Link 
                  href="/mentorship" 
                  className="block px-4 py-3 text-base font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-colors duration-200"
                  onClick={() => setMobileOpen(false)}
                >
                  Mentorship
                </Link>
                <Link 
                  href="/teams" 
                  className="block px-4 py-3 text-base font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-colors duration-200"
                  onClick={() => setMobileOpen(false)}
                >
                  Upskill your Team
                </Link>
                <Link 
                  href="/about" 
                  className="block px-4 py-3 text-base font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-colors duration-200"
                  onClick={() => setMobileOpen(false)}
                >
                  About
                </Link>
              </div>

              {/* Admin Panel - Mobile */}
              {isAdmin(user) && (
                <div className="pt-4 border-t border-indigo-100">
                  <Link 
                    href="/admin" 
                    className="block px-4 py-3 text-base font-bold rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
                    onClick={() => setMobileOpen(false)}
                  >
                    Admin Panel
                  </Link>
                </div>
              )}

              {/* User Section - Mobile */}
              <div className="pt-4 border-t border-indigo-100">
                {user ? (
                  <div className="space-y-2">
                    <div className="px-4 py-3 bg-indigo-50 rounded-lg">
                      <div className="text-base font-medium text-gray-900">
                        {user.name ?? user.email}
                      </div>
                      <div className="text-sm text-gray-500">
                        {Array.isArray(user.roles) ? user.roles.join(", ") : user.role}
                      </div>
                    </div>
                    <Link 
                      href="/profile" 
                      className="block px-4 py-3 text-base font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-colors duration-200"
                      onClick={() => setMobileOpen(false)}
                    >
                      Profile Settings
                    </Link>
                    <button 
                      onClick={() => {
                        handleLogout();
                        setMobileOpen(false);
                      }} 
                      className="w-full text-left px-4 py-3 text-base font-medium text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link 
                      href="/courses"
                      className="block px-4 py-3 text-base font-medium rounded-lg text-center text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
                      onClick={() => setMobileOpen(false)}
                    >
                      Explore our courses
                    </Link>
                    <Link 
                      href="/login" 
                      className="block px-4 py-3 text-base font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-colors duration-200"
                      onClick={() => setMobileOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link 
                      href="/apply-mentor" 
                      className="block px-4 py-3 text-base font-medium border-2 border-emerald-200 text-emerald-700 rounded-lg text-center hover:bg-emerald-50 hover:border-emerald-300 transition-all duration-200"
                      onClick={() => setMobileOpen(false)}
                    >
                      Apply as Mentor
                    </Link>
                  </div>
                )}
              </div>

              {/* Register CTA - Mobile */}
              <div className="pt-4">
                <Link 
                  href="/register" 
                  className="block px-4 py-3 text-center text-white font-bold rounded-xl shadow-lg transition-all duration-200"
                  style={{ background: BRAND.primaryGradient }}
                  onClick={() => setMobileOpen(false)}
                >
                  Register Now
                </Link>
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
