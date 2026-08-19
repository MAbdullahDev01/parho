import { DashboardShell, type DashboardNavItem } from "@/components/dashboard/DashboardShell";
import { LayoutGrid, Users, CalendarClock, Wallet, Settings } from "lucide-react";

const navItems: DashboardNavItem[] = [
  { label: "Overview", href: "/dashboard/tutor", icon: LayoutGrid },
  { label: "My Students", href: "/dashboard/tutor/students", icon: Users },
  { label: "Availability", href: "/dashboard/tutor/availability", icon: CalendarClock },
  { label: "Earnings", href: "/dashboard/tutor/earnings", icon: Wallet },
  { label: "Settings", href: "/dashboard/tutor/settings", icon: Settings },
];

export default function TutorDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell navItems={navItems} roleLabel="Tutor">
      {children}
    </DashboardShell>
  );
}