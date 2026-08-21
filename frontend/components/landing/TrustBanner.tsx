"use client";

import { fadeUp, stagger, viewport } from "@/lib/motion";
import { BadgeCheck, FileCheck2, Lock, Video } from "lucide-react";
import { motion } from "motion/react";

const ledgerSteps = [
  { icon: Video, label: "Class booked", meta: "PKR 1,200 quoted" },
  { icon: Lock, label: "Payment held", meta: "Funds in escrow" },
  { icon: BadgeCheck, label: "Class completed", meta: "60 min · confirmed" },
  { icon: FileCheck2, label: "Funds released", meta: "Tutor paid instantly" },
];

export function TrustBanner() {
  return (
    <section className="bg-ink py-24 text-bone sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-14 lg:grid-cols-2 lg:items-center lg:gap-16">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={viewport}
            variants={stagger(0.1)}
          >
            <motion.p variants={fadeUp} className="font-mono text-xs uppercase tracking-[0.14em] text-ledger-light">
              Ledger, not a promise
            </motion.p>
            <motion.h2 variants={fadeUp} className="mt-3 font-display text-3xl font-medium tracking-tight sm:text-4xl">
              Your money never sits with the tutor until class is done.
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-4 max-w-md text-sm leading-relaxed text-graphite sm:text-base">
              Every academy promises quality. Parho backs it with two
              entries in the ledger instead of a sales pitch.
            </motion.p>

            <motion.ul variants={stagger(0.1)} className="mt-9 space-y-5">
              <motion.li variants={fadeUp} className="flex gap-3">
                <FileCheck2 className="mt-0.5 h-5 w-5 shrink-0 text-ledger-light" />
                <div>
                  <p className="font-display text-[15px] font-medium">
                    Automated transcript checks
                  </p>
                  <p className="mt-1 text-sm text-graphite">
                    A tutor's record is checked against the issuing board
                    before their profile ever goes live.
                  </p>
                </div>
              </motion.li>
              <motion.li variants={fadeUp} className="flex gap-3">
                <Lock className="mt-0.5 h-5 w-5 shrink-0 text-ledger-light" />
                <div>
                  <p className="font-display text-[15px] font-medium">
                    Escrow, entry by entry
                  </p>
                  <p className="mt-1 text-sm text-graphite">
                    A no-show is logged as a 100% refund, released to your
                    wallet automatically - no ticket, no wait.
                  </p>
                </div>
              </motion.li>
            </motion.ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-md bg-ink-soft p-6 sm:p-8"
          >
            <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.1em] text-graphite">
              <span>Escrow receipt</span>
              <span>No. 004821</span>
            </div>
            <div className="tear-line mt-4 text-graphite" />

            <div className="relative mt-8 flex flex-col gap-8 sm:flex-row sm:justify-between">
              <div
                aria-hidden
                className="absolute left-5 top-5 hidden h-px w-[calc(100%-2.5rem)] overflow-hidden bg-white/10 sm:block"
              >
                <div className="h-full w-1/4 animate-thread bg-ledger-light" />
              </div>

              {ledgerSteps.map((step) => (
                <div key={step.label} className="relative flex-1 sm:text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-ink sm:mx-auto">
                    <step.icon className="h-4 w-4 text-ledger-light" />
                  </div>
                  <p className="mt-3 font-display text-sm font-medium text-bone">
                    {step.label}
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-graphite">{step.meta}</p>
                </div>
              ))}
            </div>

            <div className="tear-line mt-8 text-graphite" />
            <p className="mt-4 text-center font-mono text-[11px] text-graphite">
              Balance held: PKR 1,200 - auto-releases in 00:47:12
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}