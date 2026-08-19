import { DashboardShell, type DashboardNavItem } from "@/components/dashboard/DashboardShell";
import { LayoutGrid, Search, CalendarClock, MessageSquare, Settings } from "lucide-react";

const navItems: DashboardNavItem[] = [
  { label: "Overview", href: "/dashboard/student", icon: LayoutGrid },
  { label: "Find Tutors", href: "/dashboard/student/tutors", icon: Search },
  { label: "My Bookings", href: "/dashboard/student/bookings", icon: CalendarClock },
  { label: "Messages", href: "/dashboard/student/messages", icon: MessageSquare },
  { label: "Settings", href: "/dashboard/student/settings", icon: Settings },
];

export default function StudentDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell navItems={navItems} roleLabel="Student">
      {children}
    </DashboardShell>
  );
}