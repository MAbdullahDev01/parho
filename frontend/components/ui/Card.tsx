import { cn } from "@/lib/Utils";
import * as React from "react";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-md border border-line-light bg-card shadow-card",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

export { Card };
