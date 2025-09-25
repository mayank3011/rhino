// app/explore/page.tsx
import React from "react";
import Link from "next/link";
import Image from "next/image";
import connect from "@/lib/mongodb";
import Course from "@/models/Course";
import CourseCard from "@/components/CourseCard";

// ---------- Types ----------
type ObjIdLike = string | { toString(): string };

interface MentorLean {
  _id?: ObjIdLike;
  id?: ObjIdLike;
  name?: string;
  image?: string;
}

interface CourseLean {
  _id: ObjIdLike;
  title?: string;
  slug?: string;
  description?: string;
  duration?: string;
  price?: number | string;
  image?: string;
  mentor?: MentorLean | null;
  category?: string | null;
  published?: boolean;
  createdAt?: Date | string;
}

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

// ---------- Helpers ----------
function toIdString(id: ObjIdLike | undefined): string {
  if (!id) return "";
  return typeof id === "string" ? id : id.toString();
}

function toOptionalString(v: unknown): string | undefined {
  if (v == null) return undefined;
  return String(v);
}

function toNumber(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

type SortPair = [field: string, order: 1 | -1];
function getSort(sort?: string): SortPair[] {
  switch (sort) {
    case "price_asc":
      return [["price", 1]];
    case "price_desc":
      return [["price", -1]];
    case "newest":
    default:
      return [["createdAt", -1]];
  }
}

function buildQuery(params: URLSearchParams) {
  const q = (params.get("q") || "").trim();
  const category = (params.get("category") || "").trim();
  const minPrice = params.get("min");
  const maxPrice = params.get("max");

  const query: Record<string, unknown> = { published: true };

  if (q) {
    query.$or = [
      { title: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
      { niche: { $regex: q, $options: "i" } },
    ];
  }

  if (category) {
    query.category = category;
  }

  // numeric price filters
  const p: Record<string, number> = {};
  const minN = Number(minPrice);
  const maxN = Number(maxPrice);
  if (Number.isFinite(minN)) p.$gte = minN;
  if (Number.isFinite(maxN)) p.$lte = maxN;
  if (Object.keys(p).length) {
    query.price = p;
  }

  return query;
}

// ---------- Page ----------
export const revalidate = 0;

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  await connect();

  // normalize URLSearchParams
  const sp = new URLSearchParams();
  for (const k of Object.keys(searchParams)) {
    const v = searchParams[k];
    if (Array.isArray(v)) sp.set(k, v[0] ?? "");
    else if (typeof v === "string") sp.set(k, v);
  }

  const pageSize = Math.max(1, Math.min(48, Number(sp.get("limit") ?? 12)));
  const page = Math.max(1, Number(sp.get("page") ?? 1));
  const sortKey = sp.get("sort") ?? "newest";

  const query = buildQuery(sp);
  const skip = (page - 1) * pageSize;

  // fetch categories for filter (force to strings safely)
  const rawCats = (await Course.distinct("category", { category: { $exists: true, $ne: null } })) as unknown[];
  const categories: string[] = rawCats
    .map((c) => (typeof c === "string" ? c.trim() : String(c ?? "").trim()))
    .filter((c) => c.length > 0)
    .sort((a, b) => a.localeCompare(b));

  // query + counts
  const [docsRaw, total] = await Promise.all([
    Course.find(query)
      .sort(getSort(sortKey))
      .skip(skip)
      .limit(pageSize)
      .lean<CourseLean[]>(),
    Course.countDocuments(query),
  ]);

  const docs: FeaturedCard[] = docsRaw.map((c) => ({
    _id: toIdString(c._id),
    title: c.title ?? "Untitled",
    slug: toOptionalString(c.slug),
    excerpt: c.description ? c.description.slice(0, 180) : "",
    duration: toOptionalString(c.duration),
    price: typeof c.price === "number" ? c.price : toNumber(c.price),
    image: toOptionalString(c.image),
    mentors: c.mentor
      ? [
          {
            id: toIdString(c.mentor._id ?? c.mentor.id),
            name: toOptionalString(c.mentor.name),
            avatar: toOptionalString(c.mentor.image),
          },
        ]
      : [],
    category: toOptionalString(c.category),
  }));

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // preserve query helper
  function qp(next: Partial<Record<string, string | number | undefined>>) {
    const nextParams = new URLSearchParams(sp);
    for (const [k, v] of Object.entries(next)) {
      if (v === undefined || v === "") nextParams.delete(k);
      else nextParams.set(k, String(v));
    }
    return `?${nextParams.toString()}`;
  }

  const q = sp.get("q") ?? "";
  const activeCategory = sp.get("category") ?? "";
  const min = sp.get("min") ?? "";
  const max = sp.get("max") ?? "";

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Explore Courses</h1>
          <p className="mt-2 text-slate-600">
            Browse all programs. Filter by category, price, and sort by newest or price.
          </p>
        </div>

        {/* Sort */}
        <form className="flex items-center gap-2">
          <label className="text-sm text-slate-600">Sort</label>
          <select
            name="sort"
            defaultValue={sortKey}
            onChange={(e) => (window.location.href = qp({ sort: e.target.value, page: 1 }))}
            className="p-2 border rounded"
          >
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </form>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border shadow-sm p-4 md:p-5 mb-8">
        <form
          action="/explore"
          method="get"
          className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
        >
          {/* Search */}
          <div>
            <label className="block text-sm text-slate-600 mb-1">Search</label>
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="e.g. React, Python..."
              className="w-full p-2 border rounded"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm text-slate-600 mb-1">Category</label>
            <select name="category" defaultValue={activeCategory} className="w-full p-2 border rounded">
              <option value="">All</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Price range */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm text-slate-600 mb-1">Min ₹</label>
              <input type="number" name="min" defaultValue={min} className="w-full p-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Max ₹</label>
              <input type="number" name="max" defaultValue={max} className="w-full p-2 border rounded" />
            </div>
          </div>

          {/* Hidden sort + submit */}
          <div className="flex items-center gap-2">
            <input type="hidden" name="sort" value={sortKey} />
            <button className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700">
              Apply Filters
            </button>
            <Link
              href="/explore"
              className="px-4 py-2 border rounded hover:bg-slate-50"
            >
              Reset
            </Link>
          </div>
        </form>
      </div>

      {/* Results */}
      <div className="mb-4 text-sm text-slate-600">
        Showing <span className="font-medium">{docs.length}</span> of{" "}
        <span className="font-medium">{total}</span> results
      </div>

      {docs.length === 0 ? (
        <div className="p-6 bg-white border rounded-xl text-slate-600">No courses found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {docs.map((course) => (
            <CourseCard key={course._id || course.slug} course={course} />
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="mt-10 flex items-center justify-between">
        <div className="text-sm text-slate-600">
          Page <span className="font-medium">{page}</span> of{" "}
          <span className="font-medium">{totalPages}</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={qp({ page: Math.max(1, page - 1) })}
            className={`px-3 py-2 border rounded ${page <= 1 ? "pointer-events-none opacity-50" : "hover:bg-slate-50"}`}
            aria-disabled={page <= 1}
          >
            Prev
          </Link>
          <Link
            href={qp({ page: Math.min(totalPages, page + 1) })}
            className={`px-3 py-2 border rounded ${page >= totalPages ? "pointer-events-none opacity-50" : "hover:bg-slate-50"}`}
            aria-disabled={page >= totalPages}
          >
            Next
          </Link>
        </div>
      </div>

      {/* Brands strip (optional, matches home aesthetic) */}
      <div className="mt-16 bg-slate-50 rounded-xl border p-6">
        <h3 className="text-center text-slate-800 font-semibold mb-6">Trusted by developers at</h3>
        <div className="flex items-center justify-center flex-wrap gap-6 opacity-80">
          {["/google.svg", "/amazon.svg", "/microsoft.svg", "/vercel.svg"].map((src) => (
            <Image key={src} src={src} alt="brand" width={100} height={32} className="h-8 w-auto object-contain" />
          ))}
        </div>
      </div>
    </div>
  );
}
