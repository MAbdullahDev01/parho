import { GraduationCap } from "lucide-react";

const columns = [
  {
    title: "Product",
    links: ["How it Works", "Find a Tutor", "Become a Tutor", "Pricing"],
  },
  {
    title: "Company",
    links: ["About", "Careers", "Blog", "Contact"],
  },
  {
    title: "Trust",
    links: ["Tutor Verification", "Escrow Protection", "Refund Policy", "Safety"],
  },
  {
    title: "Legal",
    links: ["Terms of Service", "Privacy Policy"],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <a href="#" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600">
                <GraduationCap className="h-[18px] w-[18px] text-white" strokeWidth={2.5} />
              </span>
              <span className="font-display text-lg font-semibold tracking-tight text-ink">
                Parho
              </span>
            </a>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-500">
              Verified 1-on-1 online tuitions for O/A Level students across
              Pakistan — free demo first, escrow-protected always.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {columns.map((col) => (
              <div key={col.title}>
                <p className="font-display text-sm font-semibold text-ink">
                  {col.title}
                </p>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-sm text-slate-500 transition-colors hover:text-ink"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-line pt-8 sm:flex-row">
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} Parho. All rights reserved.
          </p>
          <p className="text-xs text-slate-400">Made for students across Pakistan 🇵🇰</p>
        </div>
      </div>
    </footer>
  );
}