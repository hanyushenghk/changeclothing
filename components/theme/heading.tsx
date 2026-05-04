import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function DisplayHeading({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h1
      className={cn(
        "font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-5xl",
        className,
      )}
    >
      {children}
    </h1>
  );
}
