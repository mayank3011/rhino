// app/login/page.tsx
"use client";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast"; // Import toast for better notifications

// --- Constants based on Logo Colors ---
const COLOR_PRIMARY = "indigo-600";
const COLOR_SECONDARY = "violet-700";
const COLOR_HOVER = "indigo-700";

// Define the expected structure of the form data
type LoginFormInputs = {
  email: string;
  password?: string; // Password is required, but made optional here for type safety across various form states
};

export default function Login() {
  const { register, handleSubmit } = useForm<LoginFormInputs>();
  const router = useRouter();

  // 1. FIXED: Replaced 'any' with the specific interface `LoginFormInputs`
  const onSubmit = async (data: LoginFormInputs) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      const json = await res.json().catch(() => ({}));

      if (res.ok) {
        toast.success("Login successful! Redirecting...");
        router.push("/admin");
      } else {
        const message = json.error || json.message || "Login failed";
        toast.error(message);
      }
    } catch (err) {
        console.error("Login submission error:", err);
        toast.error("Network error. Could not connect to server.");
    }
  };

  return (
    <div className="container mx-auto px-4 py-16 sm:py-24">
      <form 
        onSubmit={handleSubmit(onSubmit)} 
        className="mx-auto max-w-sm bg-white p-8 rounded-xl shadow-2xl border border-slate-100 space-y-5"
      >
        <h1 className={`text-3xl font-bold text-center text-${COLOR_SECONDARY}`}>Admin Login</h1>
        
        <div>
          <label className="sr-only" htmlFor="email-input">Email</label>
          <input 
            id="email-input"
            {...register("email", { required: true })} 
            placeholder="Email" 
            type="email"
            className="w-full p-3 border border-slate-300 rounded-lg focus:border-indigo-500" 
          />
        </div>
        
        <div>
          <label className="sr-only" htmlFor="password-input">Password</label>
          <input 
            id="password-input"
            {...register("password", { required: true })} 
            type="password" 
            placeholder="Password" 
            className="w-full p-3 border border-slate-300 rounded-lg focus:border-indigo-500" 
          />
        </div>
        
        <button 
          type="submit" 
          className={`w-full px-4 py-3 rounded-lg text-white text-lg font-semibold bg-${COLOR_PRIMARY} hover:bg-${COLOR_HOVER} transition-colors`}
        >
          Login
        </button>
        
        <p className="text-sm text-center text-slate-500">
            For internal access only.
        </p>
      </form>
    </div>
  );
}