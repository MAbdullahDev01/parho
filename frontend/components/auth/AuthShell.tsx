import Link from "next/link";
import { GraduationCap, ShieldCheck, Lock, Clock3, Star } from "lucide-react";

const trustIndicators = [
  { icon: ShieldCheck, label: "Transcript-verified tutors" },
  { icon: Lock, label: "Hourly escrow protection" },
  { icon: Clock3, label: "Free 15-min demo, every time" },
];

export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel — hidden on small screens */}
      <div className="relative hidden overflow-hidden bg-ink px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between xl:px-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-40 h-[560px] bg-[radial-gradient(60%_60%_at_30%_0%,rgba(16,185,129,0.16),transparent),radial-gradient(40%_40%_at_90%_20%,rgba(79,70,229,0.14),transparent)]"
        />

        <Link href="/" className="relative flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600">
            <GraduationCap className="h-[18px] w-[18px] text-white" strokeWidth={2.5} />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">
            Parho
          </span>
        </Link>

        <div className="relative max-w-md">
          <p className="text-sm font-semibold text-emerald-400">{eyebrow}</p>
          <h1 className="mt-3 font-display text-3xl font-semibold leading-[1.12] tracking-tight xl:text-4xl">
            {title}
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-slate-300">
            {subtitle}
          </p>

          <dl className="mt-8 space-y-3.5">
            {trustIndicators.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10">
                  <Icon className="h-3.5 w-3.5 text-emerald-400" strokeWidth={2.25} />
                </span>
                <dt className="text-sm font-medium text-slate-200">{label}</dt>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-1 text-amber-400">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-3.5 w-3.5 fill-current" />
            ))}
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-200">
            &ldquo;Booked a free demo, liked the tutor, paid hourly. My refund
            went through automatically the one time a class got
            rescheduled.&rdquo;
          </p>
          <p className="mt-3 text-xs font-medium text-slate-400">
            Sarah K. &middot; A-Level Parent, Lahore
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-col justify-between px-4 py-8 sm:px-6 lg:px-12 lg:py-12 xl:px-20">
        <Link href="/" className="flex items-center gap-2 lg:hidden">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600">
            <GraduationCap className="h-[18px] w-[18px] text-white" strokeWidth={2.5} />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-ink">
            Parho
          </span>
        </Link>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10 lg:py-0">
          {children}
        </div>

        <p className="text-center text-xs text-slate-400">
          &copy; {new Date().getFullYear()} Parho &middot;{" "}
          <Link href="#" className="font-medium text-slate-500 hover:text-ink">
            Terms
          </Link>{" "}
          &middot;{" "}
          <Link href="#" className="font-medium text-slate-500 hover:text-ink">
            Privacy
          </Link>
        </p>
      </div>
    </main>
  );
}