"use client";

import React from "react";
import { Menu, Transition } from "@headlessui/react";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative bg-[url('/pattern-grid.png')] bg-[#0f3d3e] text-white rounded-3xl overflow-hidden mx-4 lg:mx-20 mt-10">
      {/* Background pattern (optional grid lines) */}
      <div className="absolute inset-0 opacity-20" />

      <div className="relative container mx-auto px-6 py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left column */}
        <div>
          <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
            Become Top 1% in the <br /> AI-First World
          </h1>
          <p className="mt-6 text-lg text-gray-200 max-w-lg">
            Whether it is Product, Growth, Design, Business, Tech or Data,
            GrowthSchool is the place to learn from top experts in the field to
            become the Top 1%.
          </p>

          {/* CTA Dropdown */}
          <div className="mt-8">
            <Menu as="div" className="relative inline-block text-left">
              <Menu.Button className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg shadow-md font-medium transition">
                Explore Programs
              </Menu.Button>

              <Transition
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute left-0 mt-2 w-56 origin-top-left bg-white text-gray-800 rounded-lg shadow-lg ring-1 ring-black/5 focus:outline-none z-50">
                  <div className="py-2">
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          href="/courses"
                          className={`block px-4 py-2 text-sm rounded ${
                            active ? "bg-gray-100" : ""
                          }`}
                        >
                          All Courses
                        </Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          href="/workshops"
                          className={`block px-4 py-2 text-sm rounded ${
                            active ? "bg-gray-100" : ""
                          }`}
                        >
                          Workshops
                        </Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          href="/mentorship"
                          className={`block px-4 py-2 text-sm rounded ${
                            active ? "bg-gray-100" : ""
                          }`}
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

        {/* Right column (stacked cards / example program) */}
        <div className="relative flex flex-col items-center">
          <div className="space-y-6">
            <div className="bg-emerald-900/50 border border-emerald-700 shadow-lg backdrop-blur-md rounded-lg px-10 py-6 text-center text-lg font-semibold">
              D2C Founder
            </div>
            <div className="bg-emerald-900/40 border border-emerald-600 shadow-md rounded-lg px-10 py-6 text-center text-lg font-semibold">
              Product Manager
            </div>
            <div className="bg-emerald-900/30 border border-emerald-500 shadow-sm rounded-lg px-10 py-6 text-center text-lg font-semibold">
              AI Engineer
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
