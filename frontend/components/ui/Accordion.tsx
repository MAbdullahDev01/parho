"use client";

import { cn } from "@/lib/Utils";
import { Plus } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import * as React from "react";

type AccordionItemData = {
  value: string;
  question: string;
  answer: string;
};

export function Accordion({ items }: { items: AccordionItemData[] }) {
  const [openValue, setOpenValue] = React.useState<string | null>(items[0]?.value ?? null);

  return (
    <div className="divide-y divide-line-light border-y border-line-light">
      {items.map((item, i) => {
        const isOpen = openValue === item.value;
        return (
          <div key={item.value}>
            <button
              type="button"
              onClick={() => setOpenValue(isOpen ? null : item.value)}
              aria-expanded={isOpen}
              className="flex w-full items-start justify-between gap-4 py-6 text-left"
            >
              <span className="flex gap-4">
                <span className="font-mono text-xs text-ledger">Q{i + 1}</span>
                <span className="font-display text-[16px] font-medium text-carbon">
                  {item.question}
                </span>
              </span>
              <Plus
                className={cn(
                  "mt-0.5 h-4 w-4 shrink-0 text-slate transition-transform duration-300",
                  isOpen && "rotate-45 text-stamp"
                )}
              />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <p className="flex gap-4 pb-6 text-sm leading-relaxed text-slate">
                    <span className="select-none font-mono text-xs text-transparent">Q{i + 1}</span>
                    {item.answer}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}