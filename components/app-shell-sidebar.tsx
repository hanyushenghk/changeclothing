import Link from "next/link";

import { History, House, Shirt, Sparkles } from "lucide-react";

const navItems = [
  { href: "/", label: "Overview", icon: House },
  { href: "/try", label: "Try On", icon: Shirt },
  { href: "/history", label: "History", icon: History },
];

export function AppShellSidebar() {
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
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-600 transition-all duration-200 hover:translate-x-0.5 hover:bg-white hover:text-neutral-900"
              >
                <Icon className="size-4" aria-hidden />
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
        <p className="mt-2 leading-relaxed">
          Have issues or suggestions? Contact us:{" "}
          <a className="text-sky-600 underline underline-offset-2" href="mailto:feedback@hkcomass.org">
            feedback@hkcomass.org
          </a>
        </p>
        <div className="mt-3 inline-flex items-center gap-1 text-sky-600">
          <Sparkles className="size-3.5" aria-hidden />
          <span>Sidefolio-inspired theme</span>
        </div>
      </div>
    </aside>
  );
}
