"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { tutors } from "@/lib/Data";
import { fadeUp, stagger, viewport } from "@/lib/motion";
import { ShieldCheck, Star } from "lucide-react";
import { motion } from "motion/react";

export function TutorCards() {
  return (
    <section id="tutors" className="bg-page py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={fadeUp}
          className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"
        >
          <div className="max-w-xl">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-ledger">
              Open files
            </p>
            <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-carbon sm:text-4xl">
              A sample of verified toppers, ready this week.
            </h2>
          </div>
          <Button variant="outline" className="hidden sm:inline-flex">
            Browse all tutors
          </Button>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={stagger(0.1)}
          className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {tutors.map((tutor) => (
            <motion.div key={tutor.id} variants={fadeUp}>
              <Card className="paper-grain flex h-full flex-col p-6 transition-shadow duration-200 hover:shadow-elevated">
                <div className="flex items-start justify-between border-b border-line-light pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-ledger font-display text-sm font-medium text-bone">
                      {tutor.initials}
                    </div>
                    <div>
                      <p className="font-display text-[15px] font-medium text-carbon">
                        {tutor.name}
                      </p>
                      <p className="font-mono text-[11px] text-slate">{tutor.university}</p>
                    </div>
                  </div>
                  <span className="stamp-ring flex h-9 w-9 shrink-0 rotate-[-8deg] items-center justify-center text-stamp">
                    <ShieldCheck className="h-4 w-4" strokeWidth={2} />
                  </span>
                </div>

                <dl className="mt-4 space-y-1.5 font-mono text-[12px]">
                  {tutor.subjects.map((s) => (
                    <div key={s.name} className="flex items-center justify-between">
                      <dt className="text-slate">{s.name}</dt>
                      <dd className="font-medium text-carbon">{s.grade}</dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-4 flex items-center gap-1 text-amber-600">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3.5 w-3.5 ${
                        i < Math.round(tutor.rating) ? "fill-current" : "fill-none stroke-current"
                      }`}
                    />
                  ))}
                  <span className="ml-1 font-mono text-[11px] text-slate">
                    {tutor.rating} - {tutor.sessionsTaught} classes
                  </span>
                </div>

                <div className="mt-auto flex items-center justify-between border-t border-line-light pt-5">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-slate">
                      Hourly rate
                    </p>
                    <p className="font-display text-base font-medium text-carbon">
                      PKR {tutor.rate.toLocaleString()}
                    </p>
                  </div>
                  <Button size="sm" variant="stamp">
                    Book free demo
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <Button variant="outline" className="mt-8 w-full sm:hidden">
          Browse all tutors
        </Button>
      </div>
    </section>
  );
}