"use client";

import { Button } from "@/components/ui/Button";
import { fadeUp, stagger, viewport } from "@/lib/motion";
import { Check } from "lucide-react";
import { motion } from "motion/react";

const studentPoints = [
  "Transparent hourly rates - no academy overhead",
  "Every tutor transcript-checked before they teach",
  "Free 15-minute demo, no card required",
  "Pay only for hours actually taught, held safely in escrow",
];

const tutorPoints = [
  "Teach around your degree, on your own schedule",
  "Instant withdrawals - JazzCash, EasyPaisa, Raast",
  "Flexible remote teaching from anywhere in Pakistan",
  "Get discovered by students already searching your subject",
];

export function ValueSplit() {
  return (
    <section id="for-tutors" className="bg-page pb-24 sm:pb-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={viewport}
            variants={stagger(0.08)}
            className="rounded-md border border-line-light bg-card p-8 sm:p-10"
          >
            <motion.p variants={fadeUp} className="font-mono text-xs uppercase tracking-[0.14em] text-ledger">
              For students &amp; parents
            </motion.p>
            <motion.h3 variants={fadeUp} className="mt-3 font-display text-2xl font-medium tracking-tight text-carbon">
              Quality tuition, on the record.
            </motion.h3>
            <ul className="mt-6 space-y-3.5">
              {studentPoints.map((point) => (
                <motion.li key={point} variants={fadeUp} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ledger-50">
                    <Check className="h-3 w-3 text-ledger" strokeWidth={3} />
                  </span>
                  <span className="text-sm leading-relaxed text-slate">
                    {point}
                  </span>
                </motion.li>
              ))}
            </ul>
            <motion.div variants={fadeUp}>
              <Button className="mt-8" variant="outline">
                Find your tutor
              </Button>
            </motion.div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={viewport}
            variants={stagger(0.08)}
            className="rounded-md bg-ink p-8 text-bone sm:p-10"
          >
            <motion.p variants={fadeUp} className="font-mono text-xs uppercase tracking-[0.14em] text-stamp">
              For tutors
            </motion.p>
            <motion.h3 variants={fadeUp} className="mt-3 font-display text-2xl font-medium tracking-tight">
              Turn your transcript into income.
            </motion.h3>
            <ul className="mt-6 space-y-3.5">
              {tutorPoints.map((point) => (
                <motion.li key={point} variants={fadeUp} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/[0.06]">
                    <Check className="h-3 w-3 text-stamp" strokeWidth={3} />
                  </span>
                  <span className="text-sm leading-relaxed text-graphite">
                    {point}
                  </span>
                </motion.li>
              ))}
            </ul>
            <motion.div variants={fadeUp}>
              <Button className="mt-8" variant="stamp">
                Apply to tutor
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}