"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

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

export function HomeInteractivePanels() {
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
      <HomeAuth />
      {showGenerator ? (
        <HomeAIGenerator />
      ) : (
        <button
          type="button"
          className="rounded-xl border border-dashed border-neutral-300 px-4 py-3 text-sm text-neutral-700 transition hover:bg-neutral-50"
          onClick={() => setShowGenerator(true)}
        >
          点击加载 AI Image Demo（按需加载，优化首屏性能）
        </button>
      )}
    </div>
  );
}
