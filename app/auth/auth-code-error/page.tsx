import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/theme/container";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "登录失败",
  robots: { index: false, follow: false },
};

export default function AuthCodeErrorPage() {
  return (
    <Container>
      <div className="sidefolio-section mx-auto max-w-md space-y-4 py-12 text-center">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-neutral-900">第三方登录未完成</h1>
        <p className="text-sm text-muted-foreground">
          授权被取消、链接已过期或配置有误。请关闭本页后从网站再次使用 GitHub / Google 登录重试。
        </p>
        <Link href="/" className={cn(buttonVariants(), "inline-flex rounded-xl")}>
          返回首页
        </Link>
      </div>
    </Container>
  );
}
