import { FileCheck2, Lock, Video, BadgeCheck } from "lucide-react";

const ledgerSteps = [
  { icon: Video, label: "Class booked", meta: "PKR 1,200 quoted" },
  { icon: Lock, label: "Payment held", meta: "Funds in escrow" },
  { icon: BadgeCheck, label: "Class completed", meta: "60 min · confirmed" },
  { icon: FileCheck2, label: "Funds released", meta: "Tutor paid instantly" },
];

export function TrustBanner() {
  return (
    <section className="bg-ink py-20 text-white sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div>
            <p className="text-sm font-semibold text-emerald-400">
              The escrow &amp; verification advantage
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Your money never sits with the tutor until class is done.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-300 sm:text-base">
              Every academy promises quality. Parho backs it with two
              structural guarantees instead of a sales pitch.
            </p>

            <ul className="mt-8 space-y-5">
              <li className="flex gap-3">
                <FileCheck2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                <div>
                  <p className="font-display text-sm font-semibold">
                    Automated transcript checks
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    Every tutor's academic record is verified before they can
                    accept a single booking — you only ever learn from
                    confirmed toppers.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <Lock className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                <div>
                  <p className="font-display text-sm font-semibold">
                    Escrow payment protection
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    Pay per hour, held safely until class ends. A no-show
                    means a 100% refund, released automatically.
                  </p>
                </div>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Live escrow ledger
            </p>

            {/* Container for steps */}
            <div className="relative mt-6 flex flex-col gap-8 sm:flex-row sm:justify-between">
              
              {/* Desktop Horizontal Animated Bar */}
              <div
                aria-hidden
                className="absolute left-[12.5%] top-5 hidden h-[2px] w-[75%] overflow-hidden bg-white/10 sm:block"
              >
                <div className="animate-beam h-full w-1/2 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399]" />
              </div>

              {/* Mobile Vertical Animated Bar */}
              <div
                aria-hidden
                className="absolute left-5 top-5 block h-[calc(100%-2.5rem)] w-[2px] overflow-hidden bg-white/10 sm:hidden"
              >
                <div className="animate-beam-vertical h-1/2 w-full bg-gradient-to-b from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399]" />
              </div>

              {ledgerSteps.map((step) => (
                <div key={step.label} className="relative z-10 flex items-start gap-4 sm:flex-1 sm:flex-col sm:items-center sm:text-center">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-emerald-500/30 bg-ink shadow-[0_0_15px_rgba(52,211,153,0.15)] ring-4 ring-ink">
                    <step.icon className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-display text-sm font-medium text-white">
                      {step.label}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">{step.meta}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}