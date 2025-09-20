"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";

type Partner = { id: string; name: string; logo?: string; personName?: string };
type ReviewChip = { id: string; label: string; provider?: string; rating?: string };

// sample data (replace with your real data)
const partners: Partner[] = [
  { id: "p1", name: "Google", logo: "/logos/google.png", personName: "Anita" },
  { id: "p2", name: "apna", logo: "/logos/apna.png", personName: "Sneha" },
  { id: "p3", name: "Capgemini", logo: "/logos/capgemini.png", personName: "Ria" },
  { id: "p4", name: "Darwinbox", logo: "/logos/darwinbox.png", personName: "Maya" },
  { id: "p5", name: "Simplilearn", logo: "/logos/simplilearn.png", personName: "Arun" },
  { id: "p6", name: "Cognizant", logo: "/logos/cognizant.png", personName: "Vikram" },
  { id: "p7", name: "Flipkart", logo: "/logos/flipkart.png", personName: "Rahul" },
];

const reviews: ReviewChip[] = [
  { id: "r1", provider: "Google Reviews", label: "Rated 4.6/5 (3,730)" },
  { id: "r2", provider: "Trustpilot", label: "Excellent (4.7/5)" },
  { id: "r3", provider: "LinkedIn", label: "Top feedback" },
];

export default function ImpactSection() {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(0.5); // px per animation frame tick multiplier
  const [isHovered, setIsHovered] = useState(false);

  // Duplicate items for seamless loop
  const items = [...partners, ...partners];

  // Auto-scroll using requestAnimationFrame for smoothness
  useEffect(() => {
    const track = trackRef.current;
    const wrapper = wrapperRef.current;
    if (!track || !wrapper) return;

    let last = performance.now();
    // baseSpeed controls px per second effectively; we use frame delta
    const basePxPerSecond = 30 * speed; // tweak for faster/slower

    function step(now: number) {
      const delta = now - last;
      last = now;
      if (!paused) {
        // move left
        const px = (basePxPerSecond * delta) / 1000;
        // advance scrollLeft
        wrapper.scrollLeft = wrapper.scrollLeft + px;
        // If we've scrolled past the first set, reset by subtracting width of one set for seamless loop
        const singleWidth = track.scrollWidth / 2;
        if (wrapper.scrollLeft >= singleWidth) {
          wrapper.scrollLeft = wrapper.scrollLeft - singleWidth;
        }
      }
      rafRef.current = requestAnimationFrame(step);
    }

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [paused, speed]);

  // Pause on hover/focus
  useEffect(() => {
    setPaused(isHovered);
  }, [isHovered]);

  // Manual nudge controls
  function nudgeLeft(px = 120) {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    wrapper.scrollLeft = Math.max(0, wrapper.scrollLeft - px);
  }
  function nudgeRight(px = 120) {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    wrapper.scrollLeft = wrapper.scrollLeft + px;
  }

  // Touch: when user touches, pause autoplay
  useEffect(() => {
    const wr = wrapperRef.current;
    if (!wr) return;
    function onTouchStart() {
      setPaused(true);
    }
    function onTouchEnd() {
      setPaused(false);
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
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* LEFT: big rounded panel */}
          <div className="lg:col-span-8 rounded-2xl overflow-hidden relative p-8">
            {/* subtle patterned background */}
            <div
              className="absolute inset-0 pointer-events-none"
              aria-hidden
              style={{
                background:
                  "radial-gradient(circle at 10px 10px, rgba(0,0,0,0.02) 1px, transparent 1px), #fbfaf6",
                backgroundSize: "36px 36px",
              }}
            />

            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-[#083033]">6.5M+ Learners</h2>
              <p className="mt-2 text-slate-700 max-w-xl">
                have reaped benefits from our programs
              </p>

              {/* Controls + carousel */}
              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={() => nudgeLeft(200)}
                  aria-label="Scroll left"
                  className="p-2 rounded-md border bg-white hover:bg-gray-50"
                >
                  ◀
                </button>

                <div
                  ref={wrapperRef}
                  className="flex-1 overflow-x-auto no-scrollbar"
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                  onFocus={() => setIsHovered(true)}
                  onBlur={() => setIsHovered(false)}
                  tabIndex={0}
                  role="region"
                  aria-label="Partner carousel"
                >
                  <div ref={trackRef} className="flex gap-4 items-center">
                    {items.map((p, i) => (
                      <div
                        key={`${p.id}-${i}`}
                        className="flex-shrink-0 w-28 sm:w-32 md:w-36 bg-white rounded-xl border border-gray-200 shadow-sm p-2 flex flex-col items-center text-center"
                        role="group"
                        aria-label={`${p.personName ?? p.name} from ${p.name}`}
                      >
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-50 flex items-center justify-center">
                          {p.logo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.logo} alt={`${p.name} logo`} className="w-full h-full object-contain" />
                          ) : (
                            <div className="text-sm text-slate-500">{p.name.slice(0, 1)}</div>
                          )}
                        </div>

                        <div className="mt-2 text-xs font-medium text-slate-800">{p.personName ?? p.name}</div>
                        <div className="text-[10px] text-slate-500 mt-1">{p.name}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => nudgeRight(200)}
                  aria-label="Scroll right"
                  className="p-2 rounded-md border bg-white hover:bg-gray-50"
                >
                  ▶
                </button>

                {/* speed controls (optional) */}
                <div className="ml-3 flex items-center gap-1 text-xs text-slate-600">
                  <button onClick={() => setSpeed((s) => Math.max(0.2, s - 0.1))} className="px-2 py-1 border rounded">-</button>
                  <div className="px-2">Auto</div>
                  <button onClick={() => setSpeed((s) => Math.min(1.5, s + 0.1))} className="px-2 py-1 border rounded">+</button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: small rounded panel with stacked review chips */}
          <aside className="lg:col-span-4 rounded-2xl bg-white border border-gray-100 p-8 flex items-center justify-center">
            <div className="w-full max-w-xs">
              <div className="space-y-4">
                {reviews.map((r, idx) => (
                  <div
                    key={r.id}
                    className="bg-white rounded-md border border-gray-200 py-3 px-4 shadow-sm flex items-center justify-center"
                    style={{
                      transform: `translateY(${idx * 6}px)`,
                      zIndex: 30 - idx,
                    }}
                  >
                    <div className="text-sm text-slate-800">{r.provider}</div>
                    <div className="ml-3 text-xs text-slate-600">{r.label}</div>
                  </div>
                ))}
              </div>

              <div className="mt-6 text-center">
                <Link href="/reviews" className="text-sm text-emerald-700 hover:underline">
                  See more reviews
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
