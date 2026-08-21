const columns = [
  {
    title: "Product",
    links: ["How it works", "Find a tutor", "Become a tutor", "Questions"],
  },
  {
    title: "Company",
    links: ["About", "Careers", "Contact"],
  },
  {
    title: "Trust",
    links: ["Tutor verification", "Escrow protection", "Refund policy"],
  },
  {
    title: "Legal",
    links: ["Terms of service", "Privacy policy"],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-line-dark bg-ink text-bone">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <a href="#" className="flex items-center gap-2">
              <span className="stamp-ring flex h-8 w-8 rotate-[-6deg] items-center justify-center text-stamp">
                <span className="font-display text-xs font-semibold">P</span>
              </span>
              <span className="font-display text-lg font-medium tracking-tight">Parho</span>
            </a>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-graphite">
              Verified 1-on-1 online tuitions for O/A Level students across
              Pakistan - free demo first, escrow-protected always.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {columns.map((col) => (
              <div key={col.title}>
                <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-graphite">
                  {col.title}
                </p>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-sm text-bone/80 transition-colors hover:text-bone"
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

        <div className="tear-line mt-12 text-graphite" />
        <div className="mt-6 flex flex-col items-center justify-between gap-4 font-mono text-[11px] text-graphite sm:flex-row">
          <p>
            © {new Date().getFullYear()} Parho. All rights reserved.
          </p>
          <p>Filed for students across Pakistan</p>
        </div>
      </div>
    </footer>
  );
}