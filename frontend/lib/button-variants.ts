import { cva, type VariantProps } from "class-variance-authority";

/**
 * Pulled out of components/ui/Button.tsx so it can be imported from
 * Server Components (e.g. lib/ClerkAppearance.ts, used by app/sign-in and
 * app/sign-up page.tsx). Button.tsx itself has "use client" for Framer
 * Motion, which taints every export from that file — including plain
 * functions like this cva variant generator — as client-only. Keeping
 * this file free of "use client" avoids that RSC boundary error.
 */
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        stamp: "bg-stamp text-bone shadow-stamp hover:bg-stamp-deep",
        ledger: "bg-ledger text-bone hover:bg-ledger/90",
        outlineDark: "border border-line-dark text-bone hover:bg-white/5",
        outline: "border border-line-light text-carbon hover:bg-black/[0.03]",
        ghost: "text-carbon hover:bg-black/[0.04]",
        primary: "bg-stamp text-bone shadow-stamp hover:bg-stamp-deep",
        secondary: "bg-ledger text-bone hover:bg-ledger/90",
        onDark: "border border-line-dark text-bone hover:bg-white/5",
      },
      size: {
        default: "h-11 px-6",
        sm: "h-9 px-4 text-[13px]",
        lg: "h-12 px-7 text-base",
      },
    },
    defaultVariants: {
      variant: "outline",
      size: "default",
    },
  }
);

export type ButtonVariantsProps = VariantProps<typeof buttonVariants>;