import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Lead({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("max-w-2xl leading-relaxed text-muted-foreground", className)}>{children}</p>
  );
}
