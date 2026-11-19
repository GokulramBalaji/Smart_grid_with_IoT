"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function ProfileSection({ user }: { user: { name: string; email: string } }) {
  const [name, setName] = useState(user.name);
  const [savingName, setSavingName] = useState(false);
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [savingPassword, setSavingPassword] = useState(false);

  const saveName = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingName(true);
    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setSavingName(false);
    if (!res.ok) {
      toast.error("Could not update profile.");
      return;
    }
    toast.success("Profile updated.");
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.next !== passwords.confirm) {
      toast.error("New passwords do not match.");
      return;
    }
    setSavingPassword(true);
    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.next }),
    });
    const data = await res.json();
    setSavingPassword(false);
    if (!res.ok) {
      toast.error(data.error ?? "Could not update password.");
      return;
    }
    toast.success("Password updated.");
    setPasswords({ current: "", next: "", confirm: "" });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="pt-3">
          <form onSubmit={saveName} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input label="Email" value={user.email} disabled hint="Email cannot be changed" />
            <div className="sm:col-span-2">
              <Button type="submit" loading={savingName}>
                Save profile
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent className="pt-3">
          <form onSubmit={savePassword} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input
              label="Current password"
              type="password"
              value={passwords.current}
              onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
            />
            <Input
              label="New password"
              type="password"
              value={passwords.next}
              onChange={(e) => setPasswords({ ...passwords, next: e.target.value })}
              hint="8+ chars, 1 uppercase, 1 number"
            />
            <Input
              label="Confirm new password"
              type="password"
              value={passwords.confirm}
              onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
            />
            <div className="sm:col-span-3">
              <Button type="submit" loading={savingPassword}>
                Update password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
