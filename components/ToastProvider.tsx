// components/ToastProvider.tsx
"use client";
import { Toaster } from "react-hot-toast";

export default function ToastProvider() {
  // FIX: Added suppressHydrationWarning to the Toaster component.
  // This tells React to ignore attribute mismatches on the element 
  // rendered by the library, resolving the hydration error caused 
  // by external injections.
  return <Toaster position="top-right" reverseOrder={false} suppressHydrationWarning={true} />;
}