import { cn } from "@/lib/Utils";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.08em]",
  {
    variants: {
      variant: {
        stamp: "bg-stamp-50 text-stamp-deep",
        ledger: "bg-ledger-50 text-ledger",
        neutral: "bg-black/[0.04] text-slate",
        onDark: "bg-white/[0.06] text-bone",
        emerald: "bg-ledger-50 text-ledger",
        indigo: "bg-stamp-50 text-stamp-deep",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
