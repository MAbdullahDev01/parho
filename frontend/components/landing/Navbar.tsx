"use client";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/Utils";
import { Menu, X } from "lucide-react";
import { motion } from "motion/react";
import * as React from "react";

const links = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Find a tutor", href: "#tutors" },
  { label: "Become a tutor", href: "#for-tutors" },
  { label: "Questions", href: "#pricing" },
];

export function Navbar() {
  const [open, setOpen] = React.useState(false);

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="sticky top-0 z-50 border-b border-line-dark bg-ink/90 backdrop-blur-md"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="#" className="flex items-center gap-2">
          <span className="stamp-ring flex h-8 w-8 rotate-[-6deg] items-center justify-center text-stamp">
            <span className="font-display text-xs font-semibold">P</span>
          </span>
          <span className="font-display text-lg font-medium tracking-tight text-bone">
            Parho
          </span>
        </a>

        <nav className="hidden items-center gap-8 lg:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="font-mono text-[12px] uppercase tracking-[0.08em] text-graphite transition-colors hover:text-bone"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Button variant="ghost" size="sm" className="text-bone hover:bg-white/5">
            Log in
          </Button>
          <Button variant="stamp" size="sm">
            Get started
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
          className="flex h-9 w-9 items-center justify-center rounded-md text-bone lg:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div
        className={cn(
          "overflow-hidden border-t border-line-dark bg-ink transition-[max-height] duration-300 ease-in-out lg:hidden",
          open ? "max-h-96" : "max-h-0 border-t-0"
        )}
      >
        <nav className="flex flex-col gap-1 px-4 py-4 sm:px-6">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2.5 font-mono text-[12px] uppercase tracking-[0.08em] text-graphite hover:bg-white/5 hover:text-bone"
            >
              {link.label}
            </a>
          ))}
          <div className="mt-2 flex flex-col gap-2 border-t border-line-dark pt-4">
            <Button variant="outlineDark" size="sm">
              Log in
            </Button>
            <Button variant="stamp" size="sm">
              Get started
            </Button>
          </div>
        </nav>
      </div>
    </motion.header>
  );
}