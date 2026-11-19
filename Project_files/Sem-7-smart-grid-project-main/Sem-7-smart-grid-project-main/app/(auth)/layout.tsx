import Link from "next/link";
import { Zap } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <div className="flex size-9 items-center justify-center rounded-xl bg-foreground">
          <Zap className="size-[18px] text-white" fill="white" />
        </div>
        <span className="text-[17px] font-semibold text-foreground">SmartGrid Monitor</span>
      </Link>
      <div className="w-full max-w-[400px] rounded-2xl border border-border-subtle bg-surface p-8 card-shadow">
        {children}
      </div>
    </div>
  );
}
