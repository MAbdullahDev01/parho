"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/Utils";

type AccordionItemData = {
  value: string;
  question: string;
  answer: string;
};

export function Accordion({ items }: { items: AccordionItemData[] }) {
  const [openValue, setOpenValue] = React.useState<string | null>(
    items[0]?.value ?? null
  );

  return (
    <div className="divide-y divide-line rounded-2xl border border-line bg-white">
      {items.map((item) => {
        const isOpen = openValue === item.value;
        return (
          <div key={item.value}>
            <button
              type="button"
              onClick={() => setOpenValue(isOpen ? null : item.value)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left sm:px-6"
            >
              <span className="font-display text-[15px] font-medium text-ink sm:text-base">
                {item.question}
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200",
                  isOpen && "rotate-180 text-emerald-600"
                )}
              />
            </button>
            <div
              className={cn(
                "grid transition-all duration-200 ease-in-out",
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-5 text-sm leading-relaxed text-slate-600 sm:px-6">
                  {item.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}