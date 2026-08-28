"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { NAV_ITEMS } from "./nav-items";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

interface SidebarProps {
  user: { name: string; email: string; role: string };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border-subtle bg-surface lg:flex">
      <div className="flex h-16 items-center gap-2 px-6">
        <div className="flex size-8 items-center justify-center rounded-lg bg-foreground">
          <Zap className="size-4 text-white" fill="white" />
        </div>
        <span className="text-[15px] font-semibold text-foreground">SmartGrid Monitor</span>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {NAV_ITEMS.filter((item) => !item.adminOnly || user.role === "ADMIN").map((item) => {
          const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-foreground text-white"
                  : "text-foreground-muted hover:bg-surface-muted hover:text-foreground"
              )}
            >
              <Icon className="size-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border-subtle p-3">
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-surface-muted"
        >
          <Avatar name={user.name} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
            <p className="truncate text-xs text-foreground-muted">{user.email}</p>
          </div>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground-muted hover:bg-surface-muted hover:text-accent-red"
        >
          <LogOut className="size-[18px]" />
          Logout
        </button>
      </div>
    </aside>
  );
}
