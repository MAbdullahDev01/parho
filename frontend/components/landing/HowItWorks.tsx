import { Search, Video, ShieldCheck } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Search & filter",
    description:
      "Filter tutors by level, board, subject, or target grade — O/A Level, Cambridge.",
    accent: "indigo" as const,
  },
  {
    icon: Video,
    title: "Book a free 15-min demo",
    description:
      "Test teaching style and compatibility with zero commitment. No card required for the demo.",
    accent: "emerald" as const,
  },
  {
    icon: ShieldCheck,
    title: "Pay hourly, escrow-protected",
    description:
      "Your payment is held safely and only released to the tutor once the session ends successfully.",
    accent: "indigo" as const,
  },
];

const accentClasses = {
  emerald: "bg-emerald-50 text-emerald-600",
  indigo: "bg-indigo-50 text-indigo-600",
};

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-mist py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-emerald-600">How it works</p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Three steps between you and a tutor you trust.
          </h2>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className="group relative rounded-2xl border border-line bg-white p-6 transition-shadow duration-200 hover:shadow-card"
            >
              <span className="font-display text-xs font-medium text-slate-300">
                Step {i + 1}
              </span>
              <div
                className={`mt-4 flex h-11 w-11 items-center justify-center rounded-xl ${accentClasses[step.accent]}`}
              >
                <step.icon className="h-5 w-5" strokeWidth={2.25} />
              </div>
              <h3 className="mt-5 font-display text-lg font-semibold text-ink">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {step.description}
              </p>

              {i < steps.length - 1 && (
                <div
                  aria-hidden
                  className="ledger-line absolute -right-8 top-1/2 hidden h-px w-8 -translate-y-1/2 md:block"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}