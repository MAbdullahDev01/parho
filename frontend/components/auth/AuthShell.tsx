"use client";

import Link from "next/link";
import { ShieldCheck, Lock, Clock3, Star } from "lucide-react";
import { motion } from "motion/react";
import { Card } from "@/components/ui/Card";
import { fadeUp, stagger, revealClip, stampIn } from "@/lib/motion";

const trustIndicators = [
  { icon: ShieldCheck, label: "Transcript-verified tutors" },
  { icon: Lock, label: "Hourly escrow protection" },
  { icon: Clock3, label: "Free 15-min demo, every time" },
];

export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: React.ReactNode;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className="grid min-h-screen bg-page lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel — hidden on small screens, mirrors Hero.tsx's visual language */}
      <div className="relative hidden overflow-hidden bg-ink px-10 py-12 text-bone lg:flex lg:flex-col lg:justify-between xl:px-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-1/3 h-[70%] bg-[radial-gradient(55%_55%_at_50%_0%,rgba(31,111,92,0.18),transparent),radial-gradient(35%_35%_at_88%_10%,rgba(165,40,59,0.16),transparent)]"
        />

        <motion.div initial="hidden" animate="show" variants={stagger(0.12)}>
          <motion.div variants={fadeUp}>
            <Link href="/" className="flex items-center gap-2">
              <span className="stamp-ring flex h-8 w-8 rotate-[-6deg] items-center justify-center text-stamp">
                <span className="font-display text-xs font-semibold">P</span>
              </span>
              <span className="font-display text-lg font-medium tracking-tight">
                Parho
              </span>
            </Link>
          </motion.div>

          <motion.span
            variants={fadeUp}
            className="mt-10 inline-flex items-center gap-2 rounded-full border border-line-dark px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-graphite"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-ledger-light" />
            {eyebrow}
          </motion.span>

          <div className="mt-6 max-w-md overflow-hidden">
            <motion.h1
              variants={revealClip}
              className="font-display text-[2.25rem] font-medium leading-[1.1] tracking-tight sm:text-[2.6rem]"
            >
              {title}
            </motion.h1>
          </div>

          <motion.p
            variants={fadeUp}
            className="mt-4 max-w-sm text-sm leading-relaxed text-graphite sm:text-base"
          >
            {subtitle}
          </motion.p>

          <motion.dl variants={fadeUp} className="mt-9 space-y-3.5">
            {trustIndicators.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2.5">
                <Icon className="h-4 w-4 shrink-0 text-ledger-light" strokeWidth={2} />
                <dt className="text-sm text-graphite">{label}</dt>
              </div>
            ))}
          </motion.dl>
        </motion.div>

        {/* "Sworn statement" card — same receipt/ledger motif as TrustBanner.tsx */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-md border border-line-dark bg-ink-soft p-6"
        >
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.12em] text-graphite">
            <span>Verified statement</span>
            <span>No. 004821</span>
          </div>
          <div className="tear-line mt-4 text-graphite" />
          <div className="mt-4 flex items-center gap-1 text-amber-400">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-3.5 w-3.5 fill-current" />
            ))}
          </div>
          <p className="mt-3 text-sm leading-relaxed text-bone/90">
            &ldquo;Booked a free demo, liked the tutor, paid hourly. My refund
            went through automatically the one time a class got
            rescheduled.&rdquo;
          </p>
          <p className="mt-3 text-xs font-medium text-graphite">
            Sarah K. &middot; A-Level Parent, Lahore
          </p>
        </motion.div>
      </div>

      {/* Form panel */}
      <div className="flex flex-col justify-between bg-page px-4 py-8 sm:px-6 lg:px-12 lg:py-12 xl:px-20">
        <Link href="/" className="flex items-center gap-2 lg:hidden">
          <span className="stamp-ring flex h-8 w-8 rotate-[-6deg] items-center justify-center text-stamp">
            <span className="font-display text-xs font-semibold">P</span>
          </span>
          <span className="font-display text-lg font-medium tracking-tight text-carbon">
            Parho
          </span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10 lg:py-0"
        >
          <Card className="paper-grain relative p-7 shadow-elevated sm:p-8">
            {/* Floating verification stamp — same stampIn motif as Hero.tsx */}
            <motion.div
              initial="hidden"
              animate="show"
              variants={stampIn}
              className="stamp-ring pointer-events-none absolute -right-15 -top-1 hidden h-14 w-14 flex-col items-center justify-center bg-card text-stamp shadow-stamp sm:flex z-1"
            >
              <ShieldCheck className="h-4 w-4" strokeWidth={2} />
            </motion.div>

            {children}
          </Card>
        </motion.div>

        <p className="text-center text-xs text-slate">
          &copy; {new Date().getFullYear()} Parho &middot;{" "}
          <Link href="#" className="font-medium text-slate hover:text-carbon">
            Terms
          </Link>{" "}
          &middot;{" "}
          <Link href="#" className="font-medium text-slate hover:text-carbon">
            Privacy
          </Link>
        </p>
      </div>
    </main>
  );
}