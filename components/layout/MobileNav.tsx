"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Zap, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { NAV_ITEMS } from "./nav-items";
import { cn } from "@/lib/utils";

export function MobileNav({ user }: { user: { name: string; role: string } }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <div className="flex h-16 items-center justify-between border-b border-border-subtle bg-surface px-4 lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-foreground">
            <Zap className="size-4 text-white" fill="white" />
          </div>
          <span className="text-[15px] font-semibold text-foreground">SmartGrid</span>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg p-2 text-foreground hover:bg-surface-muted"
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/30"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.2 }}
              className="absolute inset-y-0 left-0 flex w-72 flex-col bg-surface p-4"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="text-[15px] font-semibold text-foreground">Menu</span>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-2 text-foreground-muted hover:bg-surface-muted"
                >
                  <X className="size-5" />
                </button>
              </div>
              <nav className="flex-1 space-y-0.5">
                {NAV_ITEMS.filter((item) => !item.adminOnly || user.role === "ADMIN").map((item) => {
                  const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                        active ? "bg-foreground text-white" : "text-foreground-muted hover:bg-surface-muted"
                      )}
                    >
                      <Icon className="size-[18px]" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground-muted hover:bg-surface-muted hover:text-accent-red"
              >
                <LogOut className="size-[18px]" />
                Logout
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
