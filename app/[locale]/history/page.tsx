import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { HistoryClient } from "@/components/history-client";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getSiteUrl } from "@/lib/site-url";

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
  const title = locale === "zh" ? "历史记录" : "History";
  const description =
    locale === "zh"
      ? "试衣预览保存在本浏览器（本地存储）。"
      : "Try-on previews saved in this browser (local storage).";

  return {
    title,
    description,
    robots: { index: false, follow: true, nocache: true },
    alternates: {
      canonical: `/${locale}/history`,
      languages: {
        en: `${base}/en/history`,
        "zh-CN": `${base}/zh/history`,
      },
    },
    openGraph: {
      title: `${title} · ChangeClothing`,
      description:
        locale === "zh"
          ? "保存在本浏览器的私人试衣预览列表。"
          : "Private try-on preview list stored locally in your browser.",
      url: `/${locale}/history`,
    },
  };
}

export default async function HistoryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) {
    notFound();
  }
  const locale: Locale = raw;

  return <HistoryClient locale={locale} />;
}
