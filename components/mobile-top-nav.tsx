"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Overview" },
  { href: "/try", label: "Try On" },
  { href: "/history", label: "History" },
];

export function MobileTopNav() {
  const pathname = usePathname();

  return (
    <nav className="mx-auto flex max-w-6xl items-center gap-2 text-sm">
      {items.map((item) => {
        const active = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-md px-2 py-1 text-neutral-700 transition-colors hover:bg-neutral-100",
              active && "bg-neutral-900 text-white hover:bg-neutral-900",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
