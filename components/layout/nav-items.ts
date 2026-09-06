import {
  LayoutDashboard,
  LineChart,
  Scale,
  Database,
  Bell,
  Cpu,
  FileText,
  Settings,
  ShieldCheck,
  Network,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Utilities", href: "/dashboard/utilities", icon: Network },
  { label: "Energy Analytics", href: "/dashboard/analytics", icon: LineChart },
  { label: "Load Balance", href: "/dashboard/load-balance", icon: Scale },
  { label: "Historical Data", href: "/dashboard/historical-data", icon: Database },
  { label: "Alerts", href: "/dashboard/alerts", icon: Bell },
  { label: "Devices", href: "/dashboard/devices", icon: Cpu },
  { label: "Reports", href: "/dashboard/reports", icon: FileText },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
  { label: "Admin", href: "/dashboard/admin", icon: ShieldCheck, adminOnly: true },
];
