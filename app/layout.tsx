import type { Metadata } from "next";
import { Manrope, Syne } from "next/font/google";
import { headers } from "next/headers";
import Script from "next/script";

import { isLocale } from "@/lib/i18n/config";
import { getSiteUrl } from "@/lib/site-url";
import { SITE_DESCRIPTION, SITE_KEYWORDS, SITE_NAME } from "@/lib/seo";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  applicationName: SITE_NAME,
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [...SITE_KEYWORDS],
  authors: [{ name: SITE_NAME, url: getSiteUrl() }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "technology",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerList = await headers();
  const rawLocale = headerList.get("x-cc-locale");
  const locale = rawLocale && isLocale(rawLocale) ? rawLocale : "en";
  const htmlLang = locale === "zh" ? "zh-CN" : "en";

  return (
    <html lang={htmlLang} className={`${manrope.variable} ${syne.variable} h-full antialiased`}>
      <body className="min-h-screen bg-sidebar text-foreground lg:flex lg:overflow-hidden">
        {children}
        {process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID ? (
          <>
            <Script id="crisp-init" strategy="lazyOnload">
              {`window.$crisp=[];window.CRISP_WEBSITE_ID="${process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID}";`}
            </Script>
            <Script
              id="crisp-loader"
              src="https://client.crisp.chat/l.js"
              strategy="lazyOnload"
            />
          </>
        ) : null}
      </body>
    </html>
  );
}
