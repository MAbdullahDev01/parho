"use client";

import { cn } from "@/lib/Utils";
import { UserButton } from "@clerk/nextjs";
import {
  CalendarClock,
  GraduationCap,
  LayoutGrid,
  Menu,
  MessageSquare,
  Search,
  Settings,
  ShieldCheck,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const studentNav: NavItem[] = [
  { label: "Overview", href: "/dashboard/student", icon: LayoutGrid },
  { label: "Find Tutors", href: "/dashboard/student/tutors", icon: Search },
  { label: "My Bookings", href: "/dashboard/student/bookings", icon: CalendarClock },
  { label: "Messages", href: "/dashboard/student/messages", icon: MessageSquare },
  { label: "Settings", href: "/dashboard/student/settings", icon: Settings },
];

const tutorNav: NavItem[] = [
  { label: "Overview", href: "/dashboard/tutor", icon: LayoutGrid },
  { label: "My Students", href: "/dashboard/tutor/students", icon: Users },
  { label: "Availability", href: "/dashboard/tutor/availability", icon: CalendarClock },
  { label: "Earnings", href: "/dashboard/tutor/earnings", icon: Wallet },
  { label: "Settings", href: "/dashboard/tutor/settings", icon: Settings },
];

const adminNav: NavItem[] = [
  { label: "Verification", href: "/dashboard/admin", icon: ShieldCheck },
  { label: "Settings", href: "/dashboard/admin/settings", icon: Settings },
];

export function DashboardShell({
  role,
  children,
}: {
  role: "student" | "tutor" | "admin";
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const navItems = role === "student" ? studentNav : role === "tutor" ? tutorNav : adminNav;
  const roleLabel = role === "student" ? "Student" : role === "tutor" ? "Tutor" : "Admin";

  const renderNavLinks = (onNavigate?: () => void) =>
    navItems.map((item) => {
      const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
      return (
        <Link
          key={item.href}
          href={item.href}
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
            active ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-mist hover:text-ink"
          )}
        >
          <item.icon className="h-[18px] w-[18px]" strokeWidth={2.25} />
          {item.label}
        </Link>
      );
    });

  return (
    <div className="min-h-screen bg-mist">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-line bg-white lg:flex">
        <div className="flex h-16 items-center gap-2 border-b border-line px-6">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600">
            <GraduationCap className="h-[18px] w-[18px] text-white" strokeWidth={2.5} />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-ink">Parho</span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-6">{renderNavLinks()}</nav>

        <div className="flex items-center gap-3 border-t border-line p-4">
          <UserButton />
          <span className="text-xs font-medium text-slate-500">{roleLabel}</span>
        </div>
      </aside>

      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-line bg-white px-4 lg:hidden">
        <span className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600">
            <GraduationCap className="h-[18px] w-[18px] text-white" strokeWidth={2.5} />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-ink">Parho</span>
        </span>
        <div className="flex items-center gap-3">
          <UserButton />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-ink"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {open && (
        <nav className="space-y-1 border-b border-line bg-white px-4 py-3 lg:hidden">
          {renderNavLinks(() => setOpen(false))}
        </nav>
      )}

      <main className="lg:pl-64">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
