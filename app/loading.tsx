// app/loading.tsx  (applies to the whole app; you can also put one inside /app/course etc.)
export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-white/60 backdrop-blur-sm">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
    </div>
  );
}
