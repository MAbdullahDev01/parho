"use client";

import * as React from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { GraduationCap, BookOpen, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/Utils";
import { selectRole } from "./_actions";

type Role = "student" | "tutor";

const options: {
  role: Role;
  icon: typeof BookOpen;
  title: string;
  description: string;
  accent: "emerald" | "indigo";
}[] = [
  {
    role: "student",
    icon: BookOpen,
    title: "I'm a Student",
    description: "Find verified tutors and book a free demo",
    accent: "emerald",
  },
  {
    role: "tutor",
    icon: GraduationCap,
    title: "I'm a Tutor",
    description: "Teach on your schedule and get paid hourly",
    accent: "indigo",
  },
];

const accentClasses = {
  emerald: "bg-emerald-50 text-emerald-600",
  indigo: "bg-indigo-50 text-indigo-600",
};

export default function OnboardingPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const [pending, setPending] = React.useState<Role | null>(null);
  const [error, setError] = React.useState("");

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <p className="text-sm text-slate-500">You must be signed in to view this page.</p>
      </main>
    );
  }

  const handleSelect = async (role: Role) => {
    setError("");
    setPending(role);
    const res = await selectRole(role);
    if (res.ok) {
      await user.reload();
      router.push(`/dashboard/${role}`);
      return;
    }
    setPending(null);
    setError("Something went wrong — please try again.");
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 h-[560px] bg-[radial-gradient(60%_60%_at_50%_0%,rgba(16,185,129,0.10),transparent),radial-gradient(40%_40%_at_85%_10%,rgba(79,70,229,0.10),transparent)]"
      />

      <div className="relative w-full max-w-xl text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 mx-auto">
          <GraduationCap className="h-5 w-5 text-white" strokeWidth={2.5} />
        </span>
        <h1 className="mt-5 font-display text-3xl font-semibold tracking-tight text-ink">
          How will you use Parho?
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          This decides which dashboard you'll land on — you can't switch later.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {options.map(({ role, icon: Icon, title, description, accent }) => {
            const isPending = pending === role;
            const disabled = pending !== null && !isPending;

            return (
              <Card
                key={role}
                onClick={() => !pending && handleSelect(role)}
                className={cn(
                  "flex cursor-pointer flex-col items-center gap-3 p-7 text-center transition-all duration-150",
                  disabled && "pointer-events-none opacity-40",
                  !disabled && "hover:shadow-elevated hover:-translate-y-0.5"
                )}
              >
                <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", accentClasses[accent])}>
                  {isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Icon className="h-5 w-5" strokeWidth={2.25} />
                  )}
                </div>
                <p className="font-display text-base font-semibold text-ink">{title}</p>
                <p className="text-sm text-slate-500">{description}</p>
              </Card>
            );
          })}
        </div>

        {error && <p className="mt-4 text-sm font-medium text-red-600">{error}</p>}
      </div>
    </main>
  );
}