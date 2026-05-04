import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowRight, Camera, Shirt, Sparkles, Wand2 } from "lucide-react";

import { HomeInteractivePanels } from "@/components/home-interactive-panels";
import { Container } from "@/components/theme/container";
import { DisplayHeading, SectionLabel } from "@/components/theme/heading";
import { Lead } from "@/components/theme/paragraph";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isLocale, withLocale, type Locale } from "@/lib/i18n/config";
import { getUi } from "@/lib/i18n/ui";
import { getSiteUrl } from "@/lib/site-url";
import { HOME_DESCRIPTION, SITE_KEYWORDS, SITE_NAME } from "@/lib/seo";
import { cn } from "@/lib/utils";

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
  const ogLocale = locale === "zh" ? "zh_CN" : "en_US";
  const description =
    locale === "zh"
      ? "面向海外网购的低门槛虚拟试衣：上传人像与服装图，快速获得购物场景下的静态预览参考。"
      : HOME_DESCRIPTION;

  return {
    title: locale === "zh" ? "面向海外买家的虚拟试衣" : "Virtual try-on for overseas shoppers",
    description,
    keywords: [...SITE_KEYWORDS],
    alternates: {
      canonical: `/${locale}`,
      languages: {
        en: `${base}/en`,
        "zh-CN": `${base}/zh`,
      },
    },
    openGraph: {
      url: `/${locale}`,
      title: SITE_NAME,
      description,
      locale: ogLocale,
    },
    twitter: {
      description,
    },
  };
}

function HomeJsonLd({ locale }: { locale: Locale }) {
  const siteUrl = getSiteUrl();
  const orgId = `${siteUrl}/#organization`;
  const websiteId = `${siteUrl}/#website`;
  const descriptionEn =
    "Low-friction virtual try-on previews for online apparel shopping—reference imagery, not sizing advice.";
  const descriptionZh =
    "面向海外网购的低门槛虚拟试衣预览——购物参考图，不构成尺码或合身建议。";
  const description = locale === "zh" ? descriptionZh : descriptionEn;
  const features =
    locale === "zh"
      ? ["上传人像与服装图", "自动识别服装类别", "购物场景参考预览图"]
      : [
          "Upload person and garment images",
          "Automatic garment category detection",
          "Shopping-reference preview images",
        ];

  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@id": orgId,
        "@type": "Organization",
        name: SITE_NAME,
        url: siteUrl,
        description,
      },
      {
        "@id": websiteId,
        "@type": "WebSite",
        name: SITE_NAME,
        url: siteUrl,
        description,
        inLanguage: locale === "zh" ? "zh-CN" : "en-US",
        publisher: { "@id": orgId },
      },
      {
        "@type": "SoftwareApplication",
        name: SITE_NAME,
        url: `${siteUrl}/${locale}/try`,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Web",
        description,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        isPartOf: { "@id": websiteId },
        featureList: features,
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

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) {
    notFound();
  }
  const locale: Locale = raw;
  const ui = getUi(locale);

  return (
    <>
      <HomeJsonLd locale={locale} />
      <Container>
        <div className="sidefolio-section flex flex-col">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl border border-border bg-muted/60 text-primary shadow-sm transition-colors duration-200 motion-reduce:transition-none">
              <Wand2 className="size-5" aria-hidden />
            </span>
            <SectionLabel>{ui.home.sectionOverview}</SectionLabel>
          </div>
          <div className="space-y-10">
            <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div className="space-y-6">
                <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
                  {ui.home.badge}
                </p>
                <DisplayHeading className="text-4xl sm:text-5xl">
                  {ui.home.headlineBefore}{" "}
                  <span className="underline decoration-primary decoration-2 underline-offset-8">
                    {ui.home.headlineYou}
                  </span>
                  {ui.home.headlineAfter}
                </DisplayHeading>
                <Lead className="max-w-xl text-lg leading-relaxed">{ui.home.lead}</Lead>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href={withLocale(locale, "/try")}
                    className={cn(
                      buttonVariants({ size: "lg", variant: "cta" }),
                      "cursor-pointer gap-2 rounded-xl shadow-md transition-shadow duration-200 hover:shadow-lg motion-reduce:transition-none",
                    )}
                  >
                    {ui.home.ctaTry}
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                  <Link
                    href={withLocale(locale, "/history")}
                    className={cn(
                      buttonVariants({ size: "lg", variant: "outline" }),
                      "cursor-pointer rounded-xl border-border",
                    )}
                  >
                    {ui.home.ctaHistory}
                  </Link>
                </div>
              </div>
              <Card className="sidefolio-card border-dashed border-border bg-muted/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Shirt className="size-5" aria-hidden />
                    {ui.home.cardTitle}
                  </CardTitle>
                  <CardDescription>{ui.home.cardDesc}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 rounded-xl border border-border bg-card/80 p-4 transition-colors duration-200 hover:border-primary/25 motion-reduce:transition-none">
                    <Camera className="size-6 text-primary" aria-hidden />
                    <p className="font-medium">{ui.home.feature1Title}</p>
                    <p className="text-sm text-muted-foreground">{ui.home.feature1Desc}</p>
                  </div>
                  <div className="space-y-2 rounded-xl border border-border bg-card/80 p-4 transition-colors duration-200 hover:border-primary/25 motion-reduce:transition-none">
                    <Sparkles className="size-6 text-primary" aria-hidden />
                    <p className="font-medium">{ui.home.feature2Title}</p>
                    <p className="text-sm text-muted-foreground">{ui.home.feature2Desc}</p>
                  </div>
                </CardContent>
              </Card>
            </section>
            <section className="mt-10 max-w-2xl">
              <HomeInteractivePanels locale={locale} loadAiDemoLabel={ui.home.loadAiDemo} />
            </section>
          </div>
        </div>
      </Container>
    </>
  );
}
