"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }

    setDone(true);
    toast.success("Password updated. You can now sign in.");
  };

  if (!token) {
    return (
      <p className="text-center text-sm text-foreground-muted">
        This reset link is missing a token. Please request a new one from the{" "}
        <Link href="/forgot-password" className="text-accent-blue hover:underline">
          forgot password
        </Link>{" "}
        page.
      </p>
    );
  }

  if (done) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-accent-green-soft">
          <CheckCircle2 className="size-6 text-accent-green" />
        </div>
        <h1 className="text-xl font-semibold text-foreground">Password updated</h1>
        <p className="mt-1 text-sm text-foreground-muted">Your password has been changed successfully.</p>
        <Button className="mt-6 w-full" size="lg" onClick={() => router.push("/login")}>
          Go to sign in
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 text-center">
        <h1 className="text-xl font-semibold text-foreground">Set a new password</h1>
        <p className="mt-1 text-sm text-foreground-muted">Choose a strong password for your account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="New password"
          type="password"
          icon={<Lock className="size-4" />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint="Must include an uppercase letter and a number"
          required
        />
        <Input
          label="Confirm password"
          type="password"
          icon={<Lock className="size-4" />}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
        {error && <p className="rounded-lg bg-accent-red-soft px-3 py-2 text-sm text-accent-red">{error}</p>}
        <Button type="submit" className="w-full" size="lg" loading={loading}>
          Update password
        </Button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
