import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";

interface DashboardShellProps {
  user: { name: string; email: string; role: string };
  children: React.ReactNode;
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar user={user} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav user={user} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
