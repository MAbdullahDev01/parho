"use client";

import { fadeUp, stagger, viewport } from "@/lib/motion";
import { Search, ShieldCheck, Video } from "lucide-react";
import { motion } from "motion/react";

const clauses = [
  {
    mark: "S1",
    icon: Search,
    title: "Search & filter",
    description:
      "Filter by level, board, subject, or target grade - O/A Level, Cambridge, or Federal Board.",
  },
  {
    mark: "S2",
    icon: Video,
    title: "Book a free demo",
    description:
      "15 minutes, no card required. Judge teaching style and fit before you commit to anything.",
  },
  {
    mark: "S3",
    icon: ShieldCheck,
    title: "Pay hourly, in escrow",
    description:
      "Funds are held until the session ends successfully, then released - never before.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-page py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={fadeUp}
          className="max-w-2xl"
        >
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-ledger">
            How it works
          </p>
          <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-carbon sm:text-4xl">
            Three clauses. Nothing hidden below the fold.
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={stagger(0.14)}
          className="mt-14 grid gap-px overflow-hidden rounded-md border border-line-light bg-line-light sm:grid-cols-3"
        >
          {clauses.map((clause) => (
            <motion.div key={clause.mark} variants={fadeUp} className="bg-card p-7">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-slate">{clause.mark}</span>
                <clause.icon className="h-5 w-5 text-ledger" strokeWidth={1.75} />
              </div>
              <h3 className="mt-6 font-display text-xl font-medium text-carbon">
                {clause.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate">
                {clause.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}