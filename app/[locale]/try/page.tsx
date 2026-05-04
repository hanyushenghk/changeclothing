import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { GameProvider } from "@/context/game-context";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { TryOnWorkspace } from "@/components/try-on/try-on-workspace";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getSiteUrl } from "@/lib/site-url";
import { SITE_NAME, TRY_DESCRIPTION } from "@/lib/seo";

const TRY_DESCRIPTION_ZH =
  "上传你的人像照与服装图，生成用于购物参考的虚拟试衣预览图。";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  if (!isLocale(raw)) {
    return {};
  }
  const locale = raw;
  const base = getSiteUrl();
  const description = locale === "zh" ? TRY_DESCRIPTION_ZH : TRY_DESCRIPTION;
  const title =
    locale === "zh" ? "试衣 — 上传照片与服装图" : "Try on — upload photo & garment";

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/try`,
      languages: {
        en: `${base}/en/try`,
        "zh-CN": `${base}/zh/try`,
      },
    },
    openGraph: {
      title: `${locale === "zh" ? "试衣" : "Try on"} · ${SITE_NAME}`,
      description,
      url: `/${locale}/try`,
      locale: locale === "zh" ? "zh_CN" : "en_US",
    },
    twitter: {
      title: `${locale === "zh" ? "试衣" : "Try on"} · ${SITE_NAME}`,
      description,
    },
  };
}

function TryJsonLd({ locale }: { locale: Locale }) {
  const siteUrl = getSiteUrl();
  const tryUrl = `${siteUrl}/${locale}/try`;
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: locale === "zh" ? "首页" : "Home",
            item: `${siteUrl}/${locale}`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: locale === "zh" ? "试衣" : "Try on",
            item: tryUrl,
          },
        ],
      },
      {
        "@type": "WebPage",
        "@id": `${tryUrl}#webpage`,
        name: locale === "zh" ? `试衣 · ${SITE_NAME}` : `Try on · ${SITE_NAME}`,
        url: tryUrl,
        description: locale === "zh" ? TRY_DESCRIPTION_ZH : TRY_DESCRIPTION,
        isPartOf: { "@type": "WebSite", name: SITE_NAME, url: siteUrl },
        inLanguage: locale === "zh" ? "zh-CN" : "en-US",
      },
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}

export default async function TryOnPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) {
    notFound();
  }
  const locale: Locale = raw;

  return (
    <>
      <TryJsonLd locale={locale} />
      <GameProvider locale={locale}>
        <div className="relative flex-1 overflow-hidden rounded-2xl bg-gradient-to-b from-muted/40 via-card to-card">
          <GlowingEffect
            disabled={false}
            proximity={1000}
            inactiveZone={0}
            spread={64}
            movementDuration={0.6}
            glow
            blur={2}
            borderWidth={2}
            className="z-10 rounded-2xl"
          />
          <TryOnWorkspace locale={locale} />
        </div>
      </GameProvider>
    </>
  );
}
