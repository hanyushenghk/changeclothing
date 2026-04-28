import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import Script from "next/script";

import { MobileTopNav } from "@/components/mobile-top-nav";
import { AppShellSidebar } from "@/components/app-shell-sidebar";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const calSans = localFont({
  src: "../public/fonts/CalSans-SemiBold.woff2",
  variable: "--font-calsans",
  weight: "600",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ChangeClothing",
    template: "%s · ChangeClothing",
  },
  description:
    "Low-friction virtual try-on previews for online apparel shopping—reference imagery, not sizing advice.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${calSans.variable} h-full antialiased`}
    >
      <body className="min-h-screen bg-neutral-100 text-foreground lg:flex lg:overflow-hidden">
        <AppShellSidebar />
        <div className="flex-1 lg:p-2">
          <main className="min-h-screen bg-white lg:h-[calc(100vh-1rem)] lg:overflow-y-auto lg:rounded-tl-2xl lg:border lg:border-neutral-200">
            <header className="border-b border-neutral-200 bg-white px-4 py-3 lg:hidden">
              <MobileTopNav />
            </header>
            {children}
          </main>
        </div>
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
