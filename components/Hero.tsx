"use client";

import React from "react";
import { Menu, Transition } from "@headlessui/react";
import Link from "next/link";

// Color constants based on the desired theme (Indigo/Violet for primary, Emerald for accent)
const PRIMARY_BG_COLOR = "bg-indigo-950"; // Dark indigo background
const ACCENT_COLOR = "bg-emerald-500";
const ACCENT_HOVER = "hover:bg-emerald-600";
const TEXT_COLOR = "text-white";
const SHADOW_COLOR = "shadow-lg shadow-indigo-900/50";

export default function Hero() {
  return (
    <section className={`relative ${PRIMARY_BG_COLOR} ${TEXT_COLOR} rounded-3xl overflow-hidden mx-4 lg:mx-20 mt-10 ${SHADOW_COLOR}`}>
      {/* Subtle Background Pattern (using radial gradient for depth) */}
      <div className="absolute inset-0 bg-indigo-900/50 opacity-50 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />

      <div className="relative container mx-auto px-6 py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        
        {/* Left column: Headline and CTA */}
        <div>
          <h1 className="text-4xl lg:text-6xl font-extrabold leading-tight tracking-tight">
            Level up your career with <span className="text-emerald-300">expert-led coding</span> programs.
          </h1>
          <p className="mt-6 text-xl text-indigo-200 max-w-xl">
            RhinoGeeks is where aspiring developers learn from top experts to master modern web technologies, build impressive projects, and land their dream jobs in the tech industry.
          </p>

          {/* CTA Dropdown */}
          <div className="mt-10">
            <Menu as="div" className="relative inline-block text-left">
              <Menu.Button className={`inline-flex items-center gap-3 ${ACCENT_COLOR} ${ACCENT_HOVER} text-white px-8 py-4 rounded-xl shadow-2xl shadow-emerald-500/40 font-bold text-lg transition-all duration-300 transform hover:scale-105`}>
                🚀 Explore Programs
              </Menu.Button>

              <Transition
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute left-0 mt-3 w-56 origin-top-left bg-white text-gray-800 rounded-xl shadow-2xl ring-1 ring-black/10 focus:outline-none z-50">
                  <div className="py-2">
                    {/* Program Links */}
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          href="/courses"
                          className={`block px-4 py-3 text-base font-medium transition-colors ${active ? "bg-indigo-50 text-indigo-700" : ""}`}
                        >
                          All Courses
                        </Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          href="/workshops"
                          className={`block px-4 py-3 text-base font-medium transition-colors ${active ? "bg-indigo-50 text-indigo-700" : ""}`}
                        >
                          Workshops
                        </Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          href="/mentorship"
                          className={`block px-4 py-3 text-base font-medium transition-colors ${active ? "bg-indigo-50 text-indigo-700" : ""}`}
                        >
                          Mentorship
                        </Link>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>

        {/* Right column: Stacked examples */}
        <div className="relative flex justify-center lg:justify-end py-10 lg:py-0">
          <div className="space-y-6 w-full max-w-sm">
            
            {/* Example Card 1 (D2C Founder) - Rotated slightly for visual interest */}
            <div className="bg-indigo-800/80 border border-indigo-600 shadow-xl backdrop-blur-sm rounded-xl px-10 py-6 text-center text-xl font-bold transform -rotate-3 transition-transform duration-500 hover:rotate-0 hover:scale-105 cursor-pointer">
              Full-Stack Development
            </div>
            
            {/* Example Card 2 (Product Manager) - Primary emphasis */}
            <div className="bg-indigo-700/90 border border-indigo-500 shadow-2xl backdrop-blur-sm rounded-xl px-10 py-6 text-center text-xl font-bold z-10 transition-transform duration-500 hover:scale-110 cursor-pointer">
              Data Science & AI
            </div>
            
            {/* Example Card 3 (AI Engineer) - Rotated slightly for visual interest */}
            <div className="bg-indigo-800/80 border border-indigo-600 shadow-xl backdrop-blur-sm rounded-xl px-10 py-6 text-center text-xl font-bold transform rotate-3 transition-transform duration-500 hover:rotate-0 hover:scale-105 cursor-pointer">
              UI/UX Design
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}