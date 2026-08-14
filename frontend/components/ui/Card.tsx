import * as React from "react";
import { cn } from "@/lib/Utils";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl border border-line bg-white shadow-card",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

export { Card };