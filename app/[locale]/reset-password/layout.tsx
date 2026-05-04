import type { Metadata } from "next";
import type { ReactNode } from "react";

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
  const locale: Locale = raw;
  const base = getSiteUrl();
  const title = locale === "zh" ? "重置密码" : "Reset password";
  const description =
    locale === "zh"
      ? "通过邮件链接为 ChangeClothing 账户设置新密码。"
      : "Set a new password for your ChangeClothing account after opening the email link.";

  return {
    title,
    description,
    robots: { index: false, follow: false, nocache: true },
    alternates: {
      canonical: `/${locale}/reset-password`,
      languages: {
        en: `${base}/en/reset-password`,
        "zh-CN": `${base}/zh/reset-password`,
      },
    },
  };
}

export default function ResetPasswordLayout({ children }: { children: ReactNode }) {
  return children;
}
