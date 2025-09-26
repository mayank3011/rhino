"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";

type Partner = { id: string; name: string; logo?: string; personName?: string };
type ReviewChip = { id: string; label: string; provider?: string; rating?: string };

// Sample data with content relevant to RhinoGeeks
const partners: Partner[] = [
  { id: "p1", name: "Google", logo: "/logos/google.png", personName: "Jane" },
  { id: "p2", name: "Flipkart", logo: "/logos/flipkart.png", personName: "Rohan" },
  { id: "p3", name: "Amazon", logo: "/logos/amazon.png", personName: "Priya" },
  { id: "p4", name: "Microsoft", logo: "/logos/microsoft.png", personName: "Saurabh" },
  { id: "p5", name: "Adobe", logo: "/logos/adobe.png", personName: "Ananya" },
  { id: "p6", name: "Capgemini", logo: "/logos/capgemini.png", personName: "Vikram" },
  { id: "p7", name: "Zomato", logo: "/logos/zomato.png", personName: "Rahul" },
];

const reviews: ReviewChip[] = [
  { id: "r1", provider: "Google Reviews", label: "Rated 4.9/5 (2,100+ reviews)" },
  { id: "r2", provider: "Trustpilot", label: "Excellent (4.8/5)" },
  { id: "r3", provider: "Course Report", label: "Top-rated Coding Bootcamp" },
];

export default function ImpactSection() {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [currentSpeed, setCurrentSpeed] = useState(0.5); // px per animation frame tick multiplier
  const [isHovered, setIsHovered] = useState(false);

  // Duplicate items for a seamless loop
  const items = [...partners, ...partners];

  // Auto-scroll using requestAnimationFrame for smoothness
  useEffect(() => {
    if (!trackRef.current || !wrapperRef.current) return;

    let last = performance.now();
    const basePxPerSecond = 30; // base speed, will be multiplied by a factor

    function step(now: number) {
      const track = trackRef.current;
      const wrapper = wrapperRef.current;

      if (!track || !wrapper) {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        return;
      }

      const delta = now - last;
      last = now;

      // New animation logic: gradually adjust speed based on hover state
      if (isHovered) {
        // Slow down to a stop
        setCurrentSpeed(s => Math.max(0, s - 0.02)); 
      } else {
        // Speed up to the normal pace
        setCurrentSpeed(s => Math.min(0.5, s + 0.02));
      }

      const px = (basePxPerSecond * currentSpeed * delta) / 1000;
      wrapper.scrollLeft += px;

      const singleWidth = track.scrollWidth / 2 || 0;
      if (singleWidth > 0 && wrapper.scrollLeft >= singleWidth) {
        wrapper.scrollLeft -= singleWidth;
      }
      
      rafRef.current = requestAnimationFrame(step);
    }
    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isHovered, currentSpeed]);


  // Touch: when user touches, pause autoplay
  useEffect(() => {
    const wr = wrapperRef.current;
    if (!wr) return;
    function onTouchStart() {
      setIsHovered(true); // Treat touch as a hover event
    }
    function onTouchEnd() {
      setIsHovered(false); // End touch, resume animation
    }
    wr.addEventListener("touchstart", onTouchStart, { passive: true });
    wr.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      wr.removeEventListener("touchstart", onTouchStart);
      wr.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  return (
    <section className="py-10">
      <div className="container mx-auto px-3">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* LEFT: big rounded panel */}
          <div className="lg:col-span-8 rounded-2xl overflow-hidden relative p-8 bg-white border border-slate-200 shadow-xl">
            {/* Subtle patterned background */}
            <div
              className="absolute inset-0 pointer-events-none opacity-50"
              aria-hidden
              style={{
                background: "radial-gradient(circle at 10px 10px, rgba(0,0,0,0.02) 1px, transparent 1px), #ffffff",
                backgroundSize: "36px 36px",
              }}
            />

            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-violet-700">6.5M+ Learners</h2>
              <p className="mt-2 text-slate-700 max-w-xl">
                from top companies have benefited from our hands-on programs.
              </p>

              {/* Autoscrolling carousel */}
              <div className="mt-6 flex items-center gap-3">
                <div
                  ref={wrapperRef}
                  className="flex-1 overflow-x-auto no-scrollbar scroll-smooth"
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                  onFocus={() => setIsHovered(true)}
                  onBlur={() => setIsHovered(false)}
                  tabIndex={0}
                  role="region"
                  aria-label="Companies that hired our learners"
                >
                  <div ref={trackRef} className="flex gap-4 items-center">
                    {items.map((p, i) => (
                      <div
                        key={`${p.id}-${i}`}
                        className="flex-shrink-0 w-28 sm:w-32 md:w-36 bg-white rounded-xl border border-gray-200 shadow-md p-4 flex flex-col items-center text-center transition-all duration-300 hover:shadow-lg hover:border-indigo-400"
                        role="group"
                        aria-label={`${p.personName ?? p.name} from ${p.name}`}
                      >
                        <div className="w-16 h-16 rounded-full overflow-hidden bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-2xl">
                          {p.name.slice(0, 1).toUpperCase()}
                        </div>

                        <div className="mt-3 text-sm font-semibold text-slate-800">{p.personName ?? p.name}</div>
                        <div className="text-xs text-slate-500 mt-1">{p.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: small rounded panel with stacked review chips */}
          <aside className="lg:col-span-4 rounded-2xl bg-white border border-gray-100 p-8 flex flex-col items-center justify-center shadow-xl">
            <div className="w-full max-w-sm">
              <h3 className="text-2xl font-bold text-center text-indigo-600 mb-6">Learner Reviews</h3>
              <div className="space-y-4">
                {reviews.map((r, idx) => (
                  <div
                    key={r.id}
                    className="bg-white rounded-xl border border-gray-200 py-3 px-6 shadow-md flex flex-col items-center text-center transition-transform duration-300 transform hover:scale-105"
                    style={{
                      transform: `translateY(${idx * 8}px)`,
                      zIndex: 30 - idx,
                      position: idx > 0 ? 'relative' : 'static'
                    }}
                  >
                    <div className="text-sm font-semibold text-slate-800">{r.label}</div>
                    <div className="text-xs text-slate-500 mt-1">{r.provider}</div>
                  </div>
                ))}
              </div>

              <div className="mt-10 text-center">
                <Link href="/reviews" className="text-sm text-emerald-700 font-medium hover:underline">
                  Read more reviews
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}