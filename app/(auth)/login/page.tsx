"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Mail, Lock } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("demo@smartgrid.io");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password.");
      toast.error("Invalid email or password.");
      return;
    }

    toast.success("Welcome back.");
    router.push(searchParams.get("callbackUrl") ?? "/dashboard");
    router.refresh();
  };

  return (
    <>
      <div className="mb-6 text-center">
        <h1 className="text-xl font-semibold text-foreground">Sign in</h1>
        <p className="mt-1 text-sm text-foreground-muted">Access your SmartGrid Monitor dashboard</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          icon={<Mail className="size-4" />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          required
        />
        <Input
          label="Password"
          type="password"
          icon={<Lock className="size-4" />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />

        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-sm font-medium text-accent-blue hover:underline">
            Forgot password?
          </Link>
        </div>

        {error && <p className="rounded-lg bg-accent-red-soft px-3 py-2 text-sm text-accent-red">{error}</p>}

        <Button type="submit" className="w-full" size="lg" loading={loading}>
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-foreground-muted">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium text-accent-blue hover:underline">
          Create one
        </Link>
      </p>

      <div className="mt-6 rounded-xl bg-surface-muted p-3 text-xs text-foreground-muted">
        <span className="font-medium text-foreground">Demo credentials:</span> demo@smartgrid.io /
        SmartGrid#2026
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
