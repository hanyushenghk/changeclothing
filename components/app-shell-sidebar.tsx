import Link from "next/link";

import { History, House, Shirt, Sparkles } from "lucide-react";

import { LocaleSwitcher } from "@/components/locale-switcher";
import { withLocale, type Locale } from "@/lib/i18n/config";
import type { UiDictionary } from "@/lib/i18n/ui";

type AppShellSidebarProps = {
  locale: Locale;
  ui: UiDictionary;
};

export function AppShellSidebar({ locale, ui }: AppShellSidebarProps) {
  const navItems = [
    { href: withLocale(locale, "/"), label: ui.nav.overview, icon: House },
    { href: withLocale(locale, "/try"), label: ui.nav.tryOn, icon: Shirt },
    { href: withLocale(locale, "/history"), label: ui.nav.history, icon: History },
  ];

  return (
    <aside className="hidden h-screen w-64 shrink-0 flex-col justify-between border-r border-sidebar-border bg-sidebar px-5 py-8 lg:flex">
      <div>
        <div className="flex items-center gap-3 px-2">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/20 transition-shadow duration-200 motion-reduce:transition-none">
            <Shirt className="size-5" aria-hidden />
          </span>
          <div>
            <p className="font-heading text-sm font-semibold tracking-tight text-sidebar-foreground">
              ChangeClothing
            </p>
            <p className="text-xs text-muted-foreground">{ui.sidebar.tagline}</p>
          </div>
        </div>

        <nav className="mt-10 space-y-1" aria-label="Primary">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors duration-200 hover:bg-card hover:text-foreground motion-reduce:transition-none"
              >
                <Icon className="size-4 shrink-0 text-primary/80" aria-hidden />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-8">
          <LocaleSwitcher labels={ui.localeSwitcher} />
        </div>
      </div>

      <div className="rounded-2xl border border-sidebar-border bg-card/90 p-3 text-xs text-muted-foreground shadow-sm backdrop-blur-sm">
        <p className="font-medium text-foreground">{ui.sidebar.previewNoticeTitle}</p>
        <p className="mt-1 leading-relaxed">{ui.sidebar.previewNoticeBody}</p>
        <p className="mt-2 leading-relaxed">
          {ui.sidebar.contactPrompt}{" "}
          <a
            className="cursor-pointer font-medium text-cta underline-offset-2 hover:underline"
            href="mailto:feedback@hkcomass.org"
          >
            feedback@hkcomass.org
          </a>
        </p>
        <div className="mt-3 inline-flex items-center gap-1.5 text-primary">
          <Sparkles className="size-3.5 shrink-0" aria-hidden />
          <span>{ui.sidebar.footerNote}</span>
        </div>
      </div>
    </aside>
  );
}
