import Link from "next/link";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function LandingNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border-subtle bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-foreground">
            <Zap className="size-4 text-white" fill="white" />
          </div>
          <span className="text-[15px] font-semibold text-foreground">SmartGrid Monitor</span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          <a href="#features" className="text-sm font-medium text-foreground-muted hover:text-foreground">
            Features
          </a>
          <a href="#phases" className="text-sm font-medium text-foreground-muted hover:text-foreground">
            Three-Phase
          </a>
          <a href="#analytics" className="text-sm font-medium text-foreground-muted hover:text-foreground">
            Analytics
          </a>
          <a href="#stack" className="text-sm font-medium text-foreground-muted hover:text-foreground">
            Technology
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm">Get started</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
