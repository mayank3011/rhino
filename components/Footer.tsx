"use client";
import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-slate-50 border-t mt-0">
      <div className="container mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand */}
        <div>
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.png" alt="RhinoGeeks" width={40} height={40} />
            <div>
              <div className="font-semibold">RhinoGeeks</div>
              <div className="text-sm text-slate-600">Industry-ready skills & workshops</div>
            </div>
          </Link>
        </div>

        {/* Links */}
        <div>
          <h4 className="font-medium mb-2">Site</h4>
          <ul className="space-y-1 text-sm">
            <li><Link href="/explore" className="hover:underline">Explore Courses</Link></li>
            <li><Link href="/about" className="hover:underline">About</Link></li>
            <li><Link href="/contact" className="hover:underline">Contact</Link></li>
          </ul>
        </div>

        {/* Company / Policies */}
        <div>
          <h4 className="font-medium mb-2">Company</h4>
          <ul className="space-y-1 text-sm">
            <li><Link href="/terms" className="hover:underline">Terms</Link></li>
            <li><Link href="/privacy" className="hover:underline">Privacy</Link></li>
            <li><Link href="/refund" className="hover:underline">Refund policy</Link></li>
          </ul>
        </div>

        {/* Newsletter / Social */}
        <div>
          <h4 className="font-medium mb-2">Stay in touch</h4>
          <p className="text-sm text-slate-600 mb-3">Subscribe to get updates on new courses & workshops.</p>

          {/* simple email capture (non-functional placeholder) */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              // implement newsletter subscription later
              alert("Thanks — newsletter signup coming soon!");
            }}
            className="flex gap-2"
          >
            <input
              aria-label="Email"
              placeholder="you@example.com"
              className="flex-1 px-3 py-2 border rounded"
              type="email"
            />
            <button className="px-3 py-2 bg-indigo-600 text-white rounded">Subscribe</button>
          </form>

          <div className="mt-4 flex gap-3">
            <a aria-label="Twitter" href="#" className="text-slate-600 hover:text-indigo-600">Twitter</a>
            <a aria-label="LinkedIn" href="#" className="text-slate-600 hover:text-indigo-600">LinkedIn</a>
            <a aria-label="YouTube" href="#" className="text-slate-600 hover:text-indigo-600">YouTube</a>
          </div>
        </div>
      </div>

      <div className="border-t">
        <div className="container mx-auto px-4 py-4 text-sm text-slate-600 flex flex-col md:flex-row justify-between items-center">
          <div>© {new Date().getFullYear()} RhinoGeeks — All rights reserved.</div>
          <div className="mt-2 md:mt-0">Made with ♥ · <Link href="/terms" className="underline">Terms</Link></div>
        </div>
      </div>
    </footer>
  );
}
