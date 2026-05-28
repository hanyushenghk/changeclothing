import type { Locale } from "@/lib/i18n/config";
import { getSiteUrl } from "@/lib/site-url";
import { SITE_NAME } from "@/lib/seo";

export function HomeJsonLd({ locale }: { locale: Locale }) {
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
