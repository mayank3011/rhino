// components/ToastProvider.tsx
"use client";
import { Toaster } from "react-hot-toast";

export default function ToastProvider() {
  return (
    // FIX: Wrapping the Toaster in a div to apply suppressHydrationWarning.
    // This bypasses the TypeScript error on ToasterProps while achieving the desired hydration suppression.
    <div suppressHydrationWarning={true}>
      <Toaster position="top-right" reverseOrder={false} />
    </div>
  );
}