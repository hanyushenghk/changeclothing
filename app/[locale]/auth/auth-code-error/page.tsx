import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/theme/container";
import { buttonVariants } from "@/components/ui/button";
import { isLocale, withLocale, type Locale } from "@/lib/i18n/config";
import { getUi } from "@/lib/i18n/ui";
import { getSiteUrl } from "@/lib/site-url";
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
  const title = locale === "zh" ? "登录未完成" : "Sign-in incomplete";
  const description =
    locale === "zh"
      ? "OAuth 未完成：授权被取消、链接过期或配置有误。请关闭本页后从网站再次尝试 GitHub / Google 登录。"
      : "OAuth sign-in was cancelled or the link expired. Return to ChangeClothing and try GitHub or Google login again.";

  return {
    title,
    description,
    robots: { index: false, follow: false, nocache: true },
    alternates: {
      canonical: `/${locale}/auth/auth-code-error`,
      languages: {
        en: `${base}/en/auth/auth-code-error`,
        "zh-CN": `${base}/zh/auth/auth-code-error`,
      },
    },
  };
}

export default async function AuthCodeErrorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) {
    notFound();
  }
  const locale: Locale = raw;
  const ui = getUi(locale).authError;

  return (
    <Container>
      <div className="sidefolio-section mx-auto max-w-md space-y-4 py-12 text-center">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">{ui.title}</h1>
        <p className="text-sm text-muted-foreground">{ui.body}</p>
        <Link href={withLocale(locale, "/")} className={cn(buttonVariants(), "inline-flex rounded-xl")}>
          {ui.backHome}
        </Link>
      </div>
    </Container>
  );
}
