// app/login/page.tsx
"use client";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";

export default function Login() {
  const { register, handleSubmit } = useForm();
  const router = useRouter();

  const onSubmit = async (data: any) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    });
    const json = await res.json();
    if (res.ok) router.push("/admin");
    else alert(json.error || "Login failed");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="container mx-auto p-6 max-w-md">
      <h1 className="text-2xl font-bold mb-4">Admin Login</h1>
      <input {...register("email")} placeholder="Email" className="w-full p-2 border mb-2" />
      <input {...register("password")} type="password" placeholder="Password" className="w-full p-2 border mb-2" />
      <button className="btn-primary">Login</button>
    </form>
  );
}
