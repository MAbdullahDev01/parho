import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import {
  CalendarClock,
  Clock3,
  ShieldCheck,
  Star,
  Users,
  Video,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { tutors } from "@/lib/Data";

// TODO: replace with real data from Supabase once bookings/wallet exist.
const stats = [
  { label: "Upcoming demos", value: "1", icon: Video, accent: "emerald" as const },
  { label: "Active tutors", value: "2", icon: Users, accent: "indigo" as const },
  { label: "Hours completed", value: "6.5", icon: Clock3, accent: "emerald" as const },
  { label: "Escrow balance", value: "PKR 2,400", icon: Wallet, accent: "indigo" as const },
];

const upcomingSessions = [
  {
    id: "s1",
    tutor: "Ayesha Raza",
    initials: "AR",
    subject: "A-Level Physics",
    type: "Free demo",
    time: "Today · 5:00 PM",
  },
  {
    id: "s2",
    tutor: "Zara Malik",
    initials: "ZM",
    subject: "A-Level Economics",
    type: "Paid session",
    time: "Fri · 4:00 PM",
  },
];

const accentClasses = {
  emerald: "bg-emerald-50 text-emerald-600",
  indigo: "bg-indigo-50 text-indigo-600",
};

export default async function StudentOverviewPage() {
  const user = await currentUser();
  const firstName = user?.firstName ?? "there";

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">
        Welcome back, {firstName} 👋
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Here&apos;s what&apos;s happening with your tutoring sessions.
      </p>

      {/* Stats */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, accent }) => (
          <Card key={label} className="p-5">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${accentClasses[accent]}`}>
              <Icon className="h-4 w-4" strokeWidth={2.25} />
            </div>
            <p className="mt-4 font-display text-xl font-semibold text-ink">{value}</p>
            <p className="mt-0.5 text-xs text-slate-500">{label}</p>
          </Card>
        ))}
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        {/* Upcoming sessions */}
        <div>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-ink">
              Upcoming sessions
            </h2>
            <Link
              href="/dashboard/student/bookings"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
            >
              View all
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {upcomingSessions.length === 0 ? (
              <Card className="flex flex-col items-center gap-2 p-8 text-center">
                <CalendarClock className="h-6 w-6 text-slate-300" />
                <p className="text-sm text-slate-500">
                  No sessions booked yet — find a tutor to get started.
                </p>
                <Link href="/dashboard/student/tutors">
                  <Button size="sm" className="mt-2">
                    Find a tutor
                  </Button>
                </Link>
              </Card>
            ) : (
              upcomingSessions.map((session) => (
                <Card key={session.id} className="flex items-center gap-4 p-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-600 font-display text-sm font-semibold text-white">
                    {session.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-display text-sm font-semibold text-ink">
                        {session.tutor}
                      </p>
                      <Badge variant={session.type === "Free demo" ? "emerald" : "indigo"}>
                        {session.type}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">{session.subject}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-medium text-slate-500">{session.time}</p>
                    <Button size="sm" variant="outline" className="mt-2">
                      Join
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Recommended tutors */}
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">
            Recommended for you
          </h2>
          <div className="mt-4 space-y-3">
            {tutors.slice(0, 3).map((tutor) => (
              <Card key={tutor.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 font-display text-xs font-semibold text-white">
                      {tutor.initials}
                    </div>
                    <div>
                      <p className="font-display text-sm font-semibold text-ink">
                        {tutor.name}
                      </p>
                      <p className="text-xs text-slate-500">{tutor.university}</p>
                    </div>
                  </div>
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {tutor.subjects.map((s) => (
                    <span
                      key={s.name}
                      className="rounded-full bg-mist px-2.5 py-0.5 text-[11px] font-medium text-slate-600"
                    >
                      {s.name}
                    </span>
                  ))}
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    <span className="text-xs font-medium text-slate-500">
                      {tutor.rating}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-slate-500">
                    PKR {tutor.rate.toLocaleString()}/hr
                  </span>
                </div>
              </Card>
            ))}
          </div>

          <Link href="/dashboard/student/tutors">
            <Button variant="outline" size="sm" className="mt-4 w-full">
              Browse all tutors
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}