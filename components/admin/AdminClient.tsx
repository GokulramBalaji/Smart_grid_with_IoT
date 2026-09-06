"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Users, Cpu, Wifi, WifiOff, Database, Bell } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Table, Thead, Th, Tr, Td } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Dropdown } from "@/components/ui/Dropdown";
import { LoadingState } from "@/components/ui/Loading";
import { SeverityBadge } from "@/components/alerts/AlertBadges";
import { formatDateTime, relativeTime } from "@/lib/utils";
import { ALERT_TYPE_LABELS, type AlertRecord } from "@/types";

interface Stats {
  totalUsers: number;
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  totalReadings: number;
  recentAlerts: AlertRecord[];
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
  createdAt: string;
  _count: { utilityNodes: number };
}

const ROLE_OPTIONS = [
  { label: "User", value: "USER" },
  { label: "Admin", value: "ADMIN" },
];

export function AdminClient({ currentUserId }: { currentUserId: string }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    Promise.all([
      fetch("/api/admin/stats").then((r) => r.json()),
      fetch("/api/admin/users").then((r) => r.json()),
    ])
      .then(([statsData, usersData]) => {
        setStats(statsData);
        setUsers(usersData.users ?? []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const changeRole = async (id: string, role: string) => {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (!res.ok) {
      toast.error("Could not update role.");
      return;
    }
    toast.success("Role updated.");
    load();
  };

  if (loading || !stats) return <LoadingState label="Loading admin dashboard..." />;

  const cards = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, tone: "text-accent-blue bg-accent-blue-soft" },
    { label: "Total Devices", value: stats.totalDevices, icon: Cpu, tone: "text-[#6e56cf] bg-[#6e56cf]/10" },
    { label: "Online Devices", value: stats.onlineDevices, icon: Wifi, tone: "text-accent-green bg-accent-green-soft" },
    { label: "Offline Devices", value: stats.offlineDevices, icon: WifiOff, tone: "text-accent-red bg-accent-red-soft" },
    { label: "Total Readings", value: stats.totalReadings.toLocaleString(), icon: Database, tone: "text-accent-amber bg-accent-amber-soft" },
    { label: "Recent Alerts", value: stats.recentAlerts.length, icon: Bell, tone: "text-accent-red bg-accent-red-soft" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-foreground-muted">Platform-wide overview and user management</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.label} className="p-5">
            <div className={`flex size-9 items-center justify-center rounded-xl ${c.tone}`}>
              <c.icon className="size-[18px]" />
            </div>
            <p className="mt-3 text-xs font-medium text-foreground-muted">{c.label}</p>
            <p className="mt-0.5 text-xl font-semibold text-foreground">{c.value}</p>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent className="pt-3">
          <Table>
            <Thead>
              <tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Role</Th>
                <Th>Utilities</Th>
                <Th>Joined</Th>
              </tr>
            </Thead>
            <tbody>
              {users.map((u) => (
                <Tr key={u.id}>
                  <Td>{u.name}</Td>
                  <Td className="text-foreground-muted">{u.email}</Td>
                  <Td>
                    {u.id === currentUserId ? (
                      <Badge tone="blue">{u.role}</Badge>
                    ) : (
                      <Dropdown options={ROLE_OPTIONS} value={u.role} onChange={(v) => changeRole(u.id, v)} />
                    )}
                  </Td>
                  <Td>{u._count.utilityNodes}</Td>
                  <Td className="text-foreground-muted">{relativeTime(u.createdAt)}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Recent Alerts</CardTitle>
        </CardHeader>
        <CardContent className="pt-3">
          <Table>
            <Thead>
              <tr>
                <Th>Severity</Th>
                <Th>Type</Th>
                <Th>Device</Th>
                <Th>Message</Th>
                <Th>Timestamp</Th>
              </tr>
            </Thead>
            <tbody>
              {stats.recentAlerts.map((a) => (
                <Tr key={a.id}>
                  <Td>
                    <SeverityBadge severity={a.severity} />
                  </Td>
                  <Td>{ALERT_TYPE_LABELS[a.type]}</Td>
                  <Td>{a.device.name}</Td>
                  <Td className="max-w-xs truncate text-foreground-muted" title={a.message}>
                    {a.message}
                  </Td>
                  <Td className="whitespace-nowrap text-foreground-muted">{formatDateTime(a.timestamp)}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
