"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

import type { Locale } from "@/lib/i18n/config";

const HomeAuth = dynamic(
  () => import("@/components/home-auth").then((mod) => mod.HomeAuth),
  {
    ssr: false,
    loading: () => <div className="h-20 animate-pulse rounded-xl border bg-muted/30" />,
  },
);

const HomeAIGenerator = dynamic(
  () => import("@/components/home-ai-generator").then((mod) => mod.HomeAIGenerator),
  {
    ssr: false,
    loading: () => <div className="h-48 animate-pulse rounded-xl border bg-muted/30" />,
  },
);

export function HomeInteractivePanels({
  locale,
  loadAiDemoLabel,
}: {
  locale: Locale;
  loadAiDemoLabel: string;
}) {
  const [enabled, setEnabled] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const anchorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          setEnabled(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "200px 0px",
      },
    );

    observer.observe(anchor);
    return () => {
      observer.disconnect();
    };
  }, []);

  if (!enabled) {
    return (
      <div ref={anchorRef} className="space-y-4">
        <div className="h-20 animate-pulse rounded-xl border bg-muted/30" />
        <div className="h-48 animate-pulse rounded-xl border bg-muted/30" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <HomeAuth locale={locale} />
      {showGenerator ? (
        <HomeAIGenerator />
      ) : (
        <button
          type="button"
          className="cursor-pointer rounded-xl border border-dashed border-border bg-card/50 px-4 py-3 text-left text-sm text-muted-foreground transition-colors duration-200 hover:border-primary/30 hover:bg-muted/50 hover:text-foreground motion-reduce:transition-none"
          onClick={() => setShowGenerator(true)}
        >
          {loadAiDemoLabel}
        </button>
      )}
    </div>
  );
}
