"use client";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/Utils";
import { GraduationCap, Menu, X } from "lucide-react";
import Link from "next/link";
import * as React from "react";

const links = [
  { label: "How it Works", href: "#how-it-works" },
  { label: "Find a Tutor", href: "#tutors" },
  { label: "Become a Tutor", href: "#for-tutors" },
];

export function Navbar() {
  const [open, setOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="#" className="flex items-center gap-2">
          <span className="flex h-10 w-10  items-center justify-center rounded-lg bg-emerald-600">
            <GraduationCap className="h-[28px] w-[28px] text-white" strokeWidth={1.8} />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-ink">
            Parho
          </span>
        </a>

        <nav className="hidden items-center gap-8 lg:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/sign-in">
            <Button variant="outline" size="sm">Log In</Button>
          </Link>
          <Link href="/sign-up">
            <Button variant="primary" size="sm">Get Started</Button>
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-ink lg:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div
        className={cn(
          "overflow-hidden border-t border-line bg-white transition-[max-height] duration-300 ease-in-out lg:hidden",
          open ? "max-h-96" : "max-h-0 border-t-0"
        )}
      >
        <nav className="flex flex-col gap-1 px-4 py-4 sm:px-6">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-mist hover:text-ink"
            >
              {link.label}
            </a>
          ))}
          <div className="mt-2 flex flex-col gap-2 border-t border-line pt-4">
            <Link href="/sign-in" onClick={() => setOpen(false)}>
              <Button variant="ghost" size="sm" className="w-full">Log In</Button>
            </Link>
            <Link href="/sign-up" onClick={() => setOpen(false)}>
              <Button variant="ghost" size="sm" className="w-full">Get Started</Button>
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}