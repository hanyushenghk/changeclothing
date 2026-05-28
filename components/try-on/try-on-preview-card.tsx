"use client";

import Image from "next/image";
import Link from "next/link";
import { Wand2 } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n/config";
import { withLocale } from "@/lib/i18n/config";
import type { UiDictionary } from "@/lib/i18n/ui";
import { cn } from "@/lib/utils";

type TryOnPreviewCardProps = {
  locale: Locale;
  resultDataUrl: string | null;
  ui: UiDictionary;
};

export function TryOnPreviewCard({ locale, resultDataUrl, ui }: TryOnPreviewCardProps) {
  return (
    <Card className="sidefolio-card">
      <CardHeader>
        <CardTitle className="text-lg">{ui.tryOn.previewTitle}</CardTitle>
        <CardDescription>
          {(() => {
            const [before, after = ""] = ui.tryOn.previewDesc.split("ARK_API_KEY");
            return (
              <>
                {before}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">ARK_API_KEY</code>
                {after}
              </>
            );
          })()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {resultDataUrl ? (
          <>
            <div className="overflow-hidden rounded-xl border bg-muted/30">
              <Image
                src={resultDataUrl}
                alt={ui.tryOn.previewAlt}
                width={900}
                height={1200}
                className="w-full object-contain"
                unoptimized
              />
            </div>
            <a
              href={resultDataUrl}
              download="changeclothing-tryon.png"
              className={cn(buttonVariants({ variant: "secondary" }), "rounded-xl")}
            >
              {ui.tryOn.downloadPng}
            </a>
          </>
        ) : (
          <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/30 p-8 text-center text-sm text-muted-foreground">
            <Wand2 className="size-10 opacity-40" aria-hidden />
            <p>{ui.tryOn.emptyPreview}</p>
            <Link href={withLocale(locale, "/history")} className={cn(buttonVariants({ variant: "link" }))}>
              {ui.tryOn.emptyPreviewLink}
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
