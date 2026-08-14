import { ShieldCheck, Lock, Clock3, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";

const trustIndicators = [
  { icon: ShieldCheck, label: "Transcript Verified Tutors" },
  { icon: Lock, label: "Hourly Escrow Protection" },
  { icon: Clock3, label: "Free 15-min Demo" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 h-[560px] bg-[radial-gradient(60%_60%_at_50%_0%,rgba(16,185,129,0.10),transparent),radial-gradient(40%_40%_at_85%_10%,rgba(79,70,229,0.10),transparent)]"
      />

      <div className="relative mx-auto grid max-w-7xl gap-14 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8 lg:pb-28 lg:pt-24">
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-mist px-3.5 py-1.5 text-xs font-medium text-slate-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Now onboarding tutors for O/A Level Autumn series
          </span>

          <h1 className="mt-6 max-w-xl font-display text-4xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-[3.25rem]">
            Learn from top A* tutors.{" "}
            <span className="text-emerald-600">Guaranteed quality,</span> zero
            risk.
          </h1>

          <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-600 sm:text-lg">
            Book 1-on-1 online classes with verified university toppers.
            Start with a free 15-minute demo before you spend a single
            rupee.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" variant="primary">
              Find Your Tutor
            </Button>
            <Button size="lg" variant="outline">
              Become a Paid Tutor
            </Button>
          </div>

          <dl className="mt-10 flex flex-wrap gap-x-7 gap-y-3">
            {trustIndicators.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-emerald-600" strokeWidth={2.25} />
                <dt className="text-sm font-medium text-slate-600">{label}</dt>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative mx-auto w-full max-w-sm animate-fade-up [animation-delay:150ms] lg:mx-0 lg:ml-auto">
          <div className="rounded-2xl border border-line bg-white p-5 shadow-elevated">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Matched tutor
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                <ShieldCheck className="h-3 w-3" /> Verified
              </span>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 font-display text-sm font-semibold text-white">
                AR
              </div>
              <div>
                <p className="font-display text-sm font-semibold text-ink">
                  Ayesha Raza
                </p>
                <p className="text-xs text-slate-500">NUST · A-Level Physics</p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-1 text-amber-500">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-current" />
              ))}
              <span className="ml-1 text-xs font-medium text-slate-500">
                4.9 · 214 classes
              </span>
            </div>

            <div className="mt-5 flex items-center justify-between rounded-xl bg-mist px-3.5 py-3">
              <span className="text-xs text-slate-500">Hourly rate</span>
              <span className="font-display text-sm font-semibold text-ink">
                PKR 1,200/hr
              </span>
            </div>

            <Button className="mt-4 w-full" size="sm">
              Book Free Demo
            </Button>
          </div>

          <div className="absolute -bottom-6 -left-6 hidden items-center gap-2 rounded-xl border border-line bg-white px-4 py-3 shadow-card sm:flex">
            <Lock className="h-4 w-4 text-indigo-600" />
            <div className="leading-tight">
              <p className="text-[11px] font-medium text-slate-400">
                Held in escrow
              </p>
              <p className="font-display text-sm font-semibold text-ink">
                PKR 1,200
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}