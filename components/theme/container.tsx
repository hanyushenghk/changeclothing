import type { ReactNode } from "react";

export function Container({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">{children}</div>;
}
