import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { defaultLocale, withLocale } from "@/lib/i18n/config";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <p className="font-heading text-2xl font-semibold text-foreground">404</p>
      <p className="max-w-md text-sm text-muted-foreground">
        This page does not exist, or the link is wrong.
      </p>
      <Link href={withLocale(defaultLocale, "/")} className={cn(buttonVariants({ variant: "cta" }), "rounded-xl")}>
        Back to home
      </Link>
    </div>
  );
}
