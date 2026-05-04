import { notFound } from "next/navigation";

import { AppShellSidebar } from "@/components/app-shell-sidebar";
import { MobileTopNav } from "@/components/mobile-top-nav";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getUi } from "@/lib/i18n/ui";

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "zh" }];
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) {
    notFound();
  }
  const locale: Locale = raw;
  const ui = getUi(locale);

  return (
    <>
      <AppShellSidebar locale={locale} ui={ui} />
      <div className="flex-1 lg:p-3">
        <main className="min-h-screen bg-card lg:h-[calc(100vh-1.5rem)] lg:overflow-y-auto lg:rounded-2xl lg:border lg:border-border lg:shadow-sm">
          <header className="sticky top-0 z-20 border-b border-border bg-card/95 px-4 py-3 backdrop-blur-md lg:hidden">
            <MobileTopNav locale={locale} ui={ui.nav} />
          </header>
          {children}
        </main>
      </div>
    </>
  );
}
