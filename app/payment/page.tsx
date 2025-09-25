// app/payment/page.tsx
import React, { Suspense } from "react";
import PaymentClient from "@/components/payment/PaymentClient";

export default function PaymentPage() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-3xl font-bold mb-8 text-indigo-600">Secure Your Spot: Payment Confirmation</h1>

      <Suspense fallback={<div className="p-6 bg-white rounded-lg shadow-sm">Loading payment UI…</div>}>
        {/* All client-only logic lives inside PaymentClient */}
        <PaymentClient />
      </Suspense>
    </main>
  );
}
