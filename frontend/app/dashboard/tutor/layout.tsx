import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function TutorDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell role="tutor">
      {children}
    </DashboardShell>
  );
}