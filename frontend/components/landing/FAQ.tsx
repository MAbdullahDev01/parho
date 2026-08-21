"use client";

import { Accordion } from "@/components/ui/Accordion";
import { faqs } from "@/lib/Data";
import { fadeUp, viewport } from "@/lib/motion";
import { motion } from "motion/react";

export function FAQ() {
  const items = faqs.map((f, i) => ({
    value: `faq-${i}`,
    question: f.q,
    answer: f.a,
  }));

  return (
    <section id="pricing" className="bg-page pb-24 sm:pb-32">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={fadeUp}
          className="text-center"
        >
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-ledger">
            Deposition
          </p>
          <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-carbon sm:text-4xl">
            Questions parents ask before booking
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={fadeUp}
          className="mt-12"
        >
          <Accordion items={items} />
        </motion.div>
      </div>
    </section>
  );
}