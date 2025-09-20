// app/payment/page.tsx
"use client";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

export default function PaymentPage() {
  const params = useSearchParams();
  const name = params?.get("name");
  const email = params?.get("email");
  const phone = params?.get("phone");
  const course = params?.get("course");
  const amount = params?.get("amount");
  const promo = params?.get("promo");

  async function proceed() {
    // placeholder — integrate Stripe Checkout here later.
    toast("Stripe integration will go here. Use API to create checkout session.");
    // For now, simply redirect back and create a registration record as unpaid or store a draft
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold">Payment</h1>
      <p className="mt-3">Course: {course}</p>
      <p>Student: {name} — {email}</p>
      <p>Promo: {promo ?? "—"}</p>
      <p className="text-xl font-semibold mt-4">Amount: ₹{amount}</p>

      <div className="mt-6">
        <button onClick={proceed} className="btn-primary">Proceed to Payment (Stripe) — Coming Soon</button>
      </div>
    </div>
  );
}
