// components/SortDropdown.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface SortDropdownProps {
  sortKey: string;
}

export default function SortDropdown({ sortKey }: SortDropdownProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSortChange = (newSort: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", newSort);
    params.set("page", "1"); // Reset to first page when sorting
    router.push(`/explore?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-slate-600">Sort</label>
      <select
        value={sortKey}
        onChange={(e) => handleSortChange(e.target.value)}
        className="p-2 border rounded"
      >
        <option value="newest">Newest</option>
        <option value="price_asc">Price: Low to High</option>
        <option value="price_desc">Price: High to Low</option>
      </select>
    </div>
  );
}