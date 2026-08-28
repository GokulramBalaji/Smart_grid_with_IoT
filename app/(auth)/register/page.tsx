"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { User, Mail, Lock } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();

    if (!res.ok) {
      if (data.details?.fieldErrors) {
        const fieldErrors: Record<string, string> = {};
        for (const [key, val] of Object.entries(data.details.fieldErrors)) {
          if (Array.isArray(val) && val[0]) fieldErrors[key] = val[0] as string;
        }
        setErrors(fieldErrors);
      } else {
        toast.error(data.error ?? "Registration failed.");
      }
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      toast.success("Account created. Please sign in.");
      router.push("/login");
      return;
    }

    toast.success("Account created successfully.");
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <>
      <div className="mb-6 text-center">
        <h1 className="text-xl font-semibold text-foreground">Create your account</h1>
        <p className="mt-1 text-sm text-foreground-muted">Start monitoring your grid in minutes</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full name"
          icon={<User className="size-4" />}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Jane Doe"
          error={errors.name}
          required
        />
        <Input
          label="Email"
          type="email"
          icon={<Mail className="size-4" />}
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="you@company.com"
          error={errors.email}
          required
        />
        <Input
          label="Password"
          type="password"
          icon={<Lock className="size-4" />}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="At least 8 characters"
          hint="Must include an uppercase letter and a number"
          error={errors.password}
          required
        />

        <Button type="submit" className="w-full" size="lg" loading={loading}>
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-foreground-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-accent-blue hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
