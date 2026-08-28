"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface Tab {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export function Tabs({ tabs, defaultValue, value, onChange, className }: TabsProps) {
  const [internal, setInternal] = useState(defaultValue ?? tabs[0]?.value);
  const active = value ?? internal;

  const select = (v: string) => {
    setInternal(v);
    onChange?.(v);
  };

  return (
    <div className={cn("inline-flex items-center gap-1 rounded-xl bg-surface-muted p-1", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => select(tab.value)}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all",
            active === tab.value
              ? "bg-surface text-foreground shadow-sm"
              : "text-foreground-muted hover:text-foreground"
          )}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
