import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import {
  AlertCircle,
  CalendarClock,
  ShieldCheck,
  Star,
  Users,
  Video,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

// TODO: replace with real data from Supabase once bookings/earnings tables exist.
const stats = [
  { label: "This week's earnings", value: "PKR 8,400", icon: Wallet, accent: "emerald" as const },
  { label: "Active students", value: "5", icon: Users, accent: "indigo" as const },
  { label: "Sessions this week", value: "7", icon: Video, accent: "emerald" as const },
  { label: "Avg. rating", value: "4.9", icon: Star, accent: "indigo" as const },
];

const upcomingSessions = [
  {
    id: "s1",
    student: "Bilal Ahmed",
    initials: "BA",
    subject: "A-Level Physics",
    type: "Free demo",
    time: "Today · 6:00 PM",
  },
  {
    id: "s2",
    student: "Hira Sheikh",
    initials: "HS",
    subject: "A-Level Physics",
    type: "Paid session",
    time: "Tomorrow · 3:00 PM",
  },
];

// TODO: replace with real verification status from Supabase `users`/`tutor_profiles`.
const verificationStatus: "unverified" | "pending" | "verified" = "pending";

const accentClasses = {
  emerald: "bg-emerald-50 text-emerald-600",
  indigo: "bg-indigo-50 text-indigo-600",
};

export default async function TutorOverviewPage() {
  const user = await currentUser();
  const firstName = user?.firstName ?? "there";

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">
        Welcome back, {firstName}
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Track your students, availability, and earnings.
      </p>

      {/* Verification banner — only shows if not yet verified */}
      {verificationStatus !== "verified" && (
        <Card className="mt-6 flex items-center gap-4 border-amber-200 bg-amber-50 p-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100">
            <AlertCircle className="h-4 w-4 text-amber-600" strokeWidth={2.25} />
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-ink">
              {verificationStatus === "pending"
                ? "Transcript under review"
                : "Complete your tutor setup"}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {verificationStatus === "pending"
                ? "We're verifying your submitted transcript. This usually takes 1–2 business days."
                : "Submit your transcript and choose subjects to start accepting bookings."}
            </p>
          </div>
          {verificationStatus !== "pending" && (
            <Link href="/onboarding/tutor-setup">
              <Button size="sm">Finish setup</Button>
            </Link>
          )}
        </Card>
      )}

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
              href="/dashboard/tutor/availability"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Manage availability
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {upcomingSessions.length === 0 ? (
              <Card className="flex flex-col items-center gap-2 p-8 text-center">
                <CalendarClock className="h-6 w-6 text-slate-300" />
                <p className="text-sm text-slate-500">
                  No sessions booked yet. Make sure your availability is up to date.
                </p>
                <Link href="/dashboard/tutor/availability">
                  <Button size="sm" className="mt-2">
                    Set availability
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
                        {session.student}
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
                      Start
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Earnings + verification summary */}
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">
            Earnings snapshot
          </h2>

          <Card className="mt-4 p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">Available to withdraw</p>
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="mt-2 font-display text-2xl font-semibold text-ink">
              PKR 6,100
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Held in escrow until sessions are confirmed complete.
            </p>
            <Button size="sm" className="mt-4 w-full">
              Withdraw to JazzCash / EasyPaisa
            </Button>
          </Card>

          <Card className="mt-4 p-5">
            <p className="text-xs text-slate-500">Verification status</p>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant={verificationStatus === "verified" ? "emerald" : "neutral"}>
                {verificationStatus === "verified"
                  ? "Verified"
                  : verificationStatus === "pending"
                  ? "Pending review"
                  : "Not started"}
              </Badge>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {verificationStatus === "verified"
                ? "Your transcript has been confirmed. You're visible to students."
                : "Complete transcript submission to start receiving bookings."}
            </p>
          </Card>

          <Link href="/dashboard/tutor/earnings">
            <Button variant="outline" size="sm" className="mt-4 w-full">
              View full earnings history
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}