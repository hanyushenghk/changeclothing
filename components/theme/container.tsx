import type { ReactNode } from "react";

export function Container({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-14 pt-8 sm:px-6 sm:pb-16 sm:pt-12 lg:pt-14">
      {children}
    </div>
  );
}
