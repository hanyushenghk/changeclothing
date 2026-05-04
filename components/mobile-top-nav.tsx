import Link from "next/link";

import { withLocale, type Locale } from "@/lib/i18n/config";
import type { UiDictionary } from "@/lib/i18n/ui";

type NavCopy = UiDictionary["nav"];

export function MobileTopNav({ locale, ui }: { locale: Locale; ui: NavCopy }) {
  const items = [
    { href: withLocale(locale, "/"), label: ui.overview },
    { href: withLocale(locale, "/try"), label: ui.tryOn },
    { href: withLocale(locale, "/history"), label: ui.history },
  ];

  return (
    <nav
      className="mx-auto flex max-w-6xl items-center justify-center gap-1 text-sm"
      aria-label="Primary"
    >
      {items.map((item) => {
        return (
          <Link
            key={item.href}
            href={item.href}
            className="cursor-pointer rounded-full px-3 py-1.5 font-medium text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground motion-reduce:transition-none"
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
