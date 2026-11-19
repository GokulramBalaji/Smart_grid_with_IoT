import Link from "next/link";
import { Zap } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border-subtle px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-foreground">
            <Zap className="size-3.5 text-white" fill="white" />
          </div>
          <span className="text-sm font-semibold text-foreground">SmartGrid Monitor</span>
        </div>
        <p className="text-xs text-foreground-muted">
          Intelligent Three-Phase Energy Monitoring and Analytics Platform
        </p>
        <div className="flex items-center gap-5 text-xs text-foreground-muted">
          <Link href="/login" className="hover:text-foreground">
            Sign in
          </Link>
          <Link href="/register" className="hover:text-foreground">
            Register
          </Link>
        </div>
      </div>
    </footer>
  );
}
