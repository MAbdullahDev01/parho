import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";

const studentPoints = [
  "Affordable, transparent hourly rates — no academy overhead",
  "Every tutor transcript-verified before they can teach",
  "Free 15-minute demo with any tutor, no card needed",
  "Pay only for hours actually taught, held safely in escrow",
];

const tutorPoints = [
  "Earn on your own schedule — teach around your degree",
  "Instant withdrawals to JazzCash, EasyPaisa, or Raast",
  "Flexible remote teaching from anywhere in Pakistan",
  "Get discovered by students actively searching your subject",
];

export function ValueSplit() {
  return (
    <section id="for-tutors" className="bg-mist py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-line bg-white p-8 sm:p-10">
            <p className="text-sm font-semibold text-indigo-600">
              For students &amp; parents
            </p>
            <h3 className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink">
              Quality tuition, without the risk.
            </h3>
            <ul className="mt-6 space-y-3.5">
              {studentPoints.map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-50">
                    <Check className="h-3 w-3 text-indigo-600" strokeWidth={3} />
                  </span>
                  <span className="text-sm leading-relaxed text-slate-600">
                    {point}
                  </span>
                </li>
              ))}
            </ul>
            <Button className="mt-8" variant="outline">
              Find Your Tutor
            </Button>
          </div>

          <div className="rounded-2xl border border-line bg-ink p-8 text-white sm:p-10">
            <p className="text-sm font-semibold text-emerald-400">
              For tutors
            </p>
            <h3 className="mt-3 font-display text-2xl font-semibold tracking-tight">
              Turn your transcript into income.
            </h3>
            <ul className="mt-6 space-y-3.5">
              {tutorPoints.map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/15">
                    <Check className="h-3 w-3 text-emerald-400" strokeWidth={3} />
                  </span>
                  <span className="text-sm leading-relaxed text-slate-300">
                    {point}
                  </span>
                </li>
              ))}
            </ul>
            <Button className="mt-8" variant="onDark">
              Become a Paid Tutor
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}