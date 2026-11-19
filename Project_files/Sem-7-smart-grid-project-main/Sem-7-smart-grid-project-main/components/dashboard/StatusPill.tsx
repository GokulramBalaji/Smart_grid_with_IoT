import { cn } from "@/lib/utils";
import type { DeviceConnectionStatus } from "@/types";

const config: Record<DeviceConnectionStatus, { label: string; dot: string; text: string; bg: string }> = {
  online: { label: "System Online", dot: "bg-accent-green", text: "text-accent-green", bg: "bg-accent-green-soft" },
  offline: { label: "Device Offline", dot: "bg-accent-red", text: "text-accent-red", bg: "bg-accent-red-soft" },
  provisioning: {
    label: "Awaiting First Reading",
    dot: "bg-accent-amber",
    text: "text-accent-amber",
    bg: "bg-accent-amber-soft",
  },
};

export function StatusPill({ status }: { status: DeviceConnectionStatus }) {
  const c = config[status];
  return (
    <span className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium", c.bg, c.text)}>
      <span className={cn("size-1.5 rounded-full", c.dot)} />
      {c.label}
    </span>
  );
}
