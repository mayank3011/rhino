// components/RouteProgress.tsx
"use client";
import { AppProgressBar as ProgressBar } from "next-nprogress-bar";

export default function RouteProgress() {
  return (
    <ProgressBar
      height="3px"
      color="#4f46e5"           // your brand color
      options={{ showSpinner: false }}
      shallowRouting
    />
  );
}
