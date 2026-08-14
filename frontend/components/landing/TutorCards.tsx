import { ShieldCheck, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { tutors } from "@/lib/Data";

export function TutorCards() {
  return (
    <section id="tutors" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="max-w-xl">
            <p className="text-sm font-semibold text-indigo-600">
              Find a tutor
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              A sample of verified toppers, ready this week.
            </h2>
          </div>
          <Button variant="outline" className="hidden sm:inline-flex">
            Browse all tutors
          </Button>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tutors.map((tutor) => (
            <Card
              key={tutor.id}
              className="flex flex-col p-6 transition-shadow duration-200 hover:shadow-elevated"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 font-display text-sm font-semibold text-white">
                    {tutor.initials}
                  </div>
                  <div>
                    <p className="font-display text-sm font-semibold text-ink">
                      {tutor.name}
                    </p>
                    <p className="text-xs text-slate-500">{tutor.university}</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                  <ShieldCheck className="h-3 w-3" /> Verified
                </span>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {tutor.subjects.map((s) => (
                  <span
                    key={s.name}
                    className="rounded-full bg-mist px-3 py-1 text-xs font-medium text-slate-600"
                  >
                    {s.name} · {s.grade}
                  </span>
                ))}
              </div>

              <div className="mt-5 flex items-center gap-1 text-amber-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${
                      i < Math.round(tutor.rating) ? "fill-current" : "fill-none stroke-current"
                    }`}
                  />
                ))}
                <span className="ml-1 text-xs font-medium text-slate-500">
                  {tutor.rating} · {tutor.sessionsTaught} classes
                </span>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-line pt-5">
                <div>
                  <p className="text-xs text-slate-400">Hourly rate</p>
                  <p className="font-display text-base font-semibold text-ink">
                    PKR {tutor.rate.toLocaleString()}/hr
                  </p>
                </div>
                <Button size="sm">Book Free Demo</Button>
              </div>
            </Card>
          ))}
        </div>

        <Button variant="outline" className="mt-8 w-full sm:hidden">
          Browse all tutors
        </Button>
      </div>
    </section>
  );
}