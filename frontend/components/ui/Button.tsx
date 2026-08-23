"use client";

import { cn } from "@/lib/Utils";
import { buttonVariants, type ButtonVariantsProps } from "@/lib/button-variants";
import { motion, type HTMLMotionProps } from "motion/react";
import * as React from "react";

export interface ButtonProps
  extends Omit<HTMLMotionProps<"button">, "ref">,
    ButtonVariantsProps {}

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