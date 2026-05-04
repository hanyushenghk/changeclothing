"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { isLocale, withLocale, type Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

function stripLocaleFromPathname(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) {
    return "/";
  }
  if (isLocale(parts[0])) {
    const rest = parts.slice(1).join("/");
    return rest ? `/${rest}` : "/";
  }
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

export function LocaleSwitcher({
  labels,
}: {
  labels: { label: string; en: string; zh: string };
}) {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);
  const current: Locale = parts[0] && isLocale(parts[0]) ? parts[0] : "en";
  const rest = stripLocaleFromPathname(pathname);

  const href = (locale: Locale) => {
    if (rest === "/") {
      return withLocale(locale, "/");
    }
    return withLocale(locale, rest);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      <span className="font-medium text-foreground">{labels.label}</span>
      <div className="inline-flex rounded-full border border-border bg-card/80 p-0.5">
        {(["en", "zh"] as const).map((loc) => (
          <Link
            key={loc}
            href={href(loc)}
            className={cn(
              "cursor-pointer rounded-full px-2.5 py-1 font-medium transition-colors duration-200",
              loc === current
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {loc === "en" ? labels.en : labels.zh}
          </Link>
        ))}
      </div>
    </div>
  );
}
