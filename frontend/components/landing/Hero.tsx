"use client";

import { Button } from "@/components/ui/Button";
import { fadeUp, revealClip, stagger, stampIn, viewport } from "@/lib/motion";
import { Clock3, Lock, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";

const trustLine = [
  { icon: ShieldCheck, label: "Transcript verified" },
  { icon: Lock, label: "Escrow protected" },
  { icon: Clock3, label: "Free 15-min demo" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-ink pb-24 pt-28 text-bone sm:pb-32 sm:pt-36">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-1/3 h-[70%] bg-[radial-gradient(55%_55%_at_50%_0%,rgba(31,111,92,0.18),transparent),radial-gradient(35%_35%_at_88%_10%,rgba(165,40,59,0.16),transparent)]"
      />

      <div className="relative mx-auto grid max-w-7xl gap-16 px-4 sm:px-6 lg:grid-cols-[1fr_0.95fr] lg:items-center lg:px-8">
        <motion.div initial="hidden" animate="show" variants={stagger(0.12)}>
          <motion.span
            variants={fadeUp}
            className="inline-flex items-center gap-2 rounded-full border border-line-dark px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-graphite"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-ledger-light" />
            Case file no. PK-2026-O/A
          </motion.span>

          <div className="mt-7 max-w-xl overflow-hidden">
            <motion.h1
              variants={revealClip}
              className="font-display text-[2.5rem] font-medium leading-[1.05] tracking-tight sm:text-6xl lg:text-[3.6rem]"
            >
              Every tutor, <span className="italic text-white">verified</span> on paper.
            </motion.h1>
          </div>

          <motion.p
            variants={fadeUp}
            className="mt-6 max-w-md text-base leading-relaxed text-graphite sm:text-lg"
          >
            Not a promise - a checked transcript. Book a free 15-minute demo
            with a university topper, then pay by the hour with your money
            held in escrow until class is done.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" variant="stamp">
              Find your tutor
            </Button>
            <Button size="lg" variant="outlineDark">
              Apply to tutor
            </Button>
          </motion.div>

          <motion.dl variants={fadeUp} className="mt-11 flex flex-wrap gap-x-7 gap-y-3">
            {trustLine.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-ledger-light" strokeWidth={2} />
                <dt className="text-sm text-graphite">{label}</dt>
              </div>
            ))}
          </motion.dl>
        </motion.div>

        <div className="relative mx-auto w-full max-w-sm lg:mx-0 lg:ml-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="paper-grain relative rounded-md bg-card p-6 text-carbon shadow-elevated"
          >
            <div className="flex items-center justify-between border-b border-line-light pb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-slate">
              <span>Academic transcript</span>
              <span>Ref. AR-0417</span>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-ledger font-display text-sm font-semibold text-bone">
                AR
              </div>
              <div>
                <p className="font-display text-base font-medium">Ayesha Raza</p>
                <p className="font-mono text-[11px] text-slate">NUST - Class of 2024</p>
              </div>
            </div>

            <dl className="mt-5 space-y-2 font-mono text-[12px]">
              <div className="flex items-center justify-between border-b border-dashed border-line-light py-1.5">
                <dt className="text-slate">A-Level Physics</dt>
                <dd className="font-medium">A*</dd>
              </div>
              <div className="flex items-center justify-between border-b border-dashed border-line-light py-1.5">
                <dt className="text-slate">A-Level Mathematics</dt>
                <dd className="font-medium">A*</dd>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <dt className="text-slate">Hourly rate</dt>
                <dd className="font-medium">PKR 1,200</dd>
              </div>
            </dl>

            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={viewport}
              variants={stampIn}
              className="stamp-ring pointer-events-none absolute -right-4 top-1/2 flex h-24 w-24 -translate-y-1/2 rotate-[-6deg] flex-col items-center justify-center text-stamp shadow-stamp sm:-right-6 sm:h-28 sm:w-28"
            >
              <ShieldCheck className="h-6 w-6" strokeWidth={2} />
              <span className="mt-1 font-mono text-[10px] font-bold uppercase leading-none tracking-[0.12em]">
                Verified
              </span>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.5 }}
            className="mt-5 flex items-center gap-2 rounded-md border border-line-dark px-4 py-3 font-mono text-[11px] text-graphite"
          >
            <Lock className="h-3.5 w-3.5 text-ledger-light" />
            PKR 1,200 held in escrow - released after class
          </motion.div>
        </div>
      </div>
    </section>
  );
}