"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { History, House, Shirt, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Overview", icon: House },
  { href: "/try", label: "Try On", icon: Shirt },
  { href: "/history", label: "History", icon: History },
];

export function AppShellSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden h-screen w-60 shrink-0 flex-col justify-between border-r border-neutral-200 bg-neutral-100 px-5 py-8 lg:flex">
      <div>
        <div className="flex items-center gap-3 px-2">
          <span className="flex size-10 items-center justify-center rounded-xl bg-neutral-900 text-white">
            <Shirt className="size-5" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold text-neutral-900">ChangeClothing</p>
            <p className="text-xs text-neutral-500">Virtual try-on workspace</p>
          </div>
        </div>

        <nav className="mt-10 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-600 transition-all duration-200 hover:translate-x-0.5 hover:bg-white hover:text-neutral-900",
                  active && "translate-x-0.5 bg-white text-neutral-900 shadow-sm ring-1 ring-neutral-200",
                )}
              >
                <Icon className={cn("size-4", active && "text-sky-500")} aria-hidden />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-3 text-xs text-neutral-600">
        <p className="font-medium text-neutral-900">Preview Notice</p>
        <p className="mt-1 leading-relaxed">
          Generated images are for shopping reference only and not sizing advice.
        </p>
        <div className="mt-3 inline-flex items-center gap-1 text-sky-600">
          <Sparkles className="size-3.5" aria-hidden />
          <span>Sidefolio-inspired theme</span>
        </div>
      </div>
    </aside>
  );
}
