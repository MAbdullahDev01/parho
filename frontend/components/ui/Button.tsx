"use client";

import { cn } from "@/lib/Utils";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, type HTMLMotionProps } from "motion/react";
import * as React from "react";

const buttonVariants = cva(
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

export interface ButtonProps
  extends Omit<HTMLMotionProps<"button">, "ref">,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <motion.button
        whileTap={{ scale: 0.97, y: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 28 }}
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
