"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();

    setLoading(false);
    setSent(true);
    if (data.resetUrl) setDevResetUrl(data.resetUrl);
  };

  if (sent) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-accent-green-soft">
          <CheckCircle2 className="size-6 text-accent-green" />
        </div>
        <h1 className="text-xl font-semibold text-foreground">Check your email</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          If an account exists for {email}, we&apos;ve sent a password reset link.
        </p>
        {devResetUrl && (
          <div className="mt-4 rounded-xl bg-surface-muted p-3 text-left text-xs text-foreground-muted">
            <p className="mb-1 font-medium text-foreground">Development mode — no email provider configured:</p>
            <Link href={devResetUrl} className="break-all text-accent-blue hover:underline">
              {devResetUrl}
            </Link>
          </div>
        )}
        <Link href="/login" className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-accent-blue">
          <ArrowLeft className="size-4" /> Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 text-center">
        <h1 className="text-xl font-semibold text-foreground">Reset your password</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Enter your email and we&apos;ll send you a reset link
        </p>
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
        <Button type="submit" className="w-full" size="lg" loading={loading}>
          Send reset link
        </Button>
      </form>

      <Link
        href="/login"
        className="mt-6 flex items-center justify-center gap-1.5 text-sm font-medium text-accent-blue hover:underline"
      >
        <ArrowLeft className="size-4" /> Back to sign in
      </Link>
    </>
  );
}
