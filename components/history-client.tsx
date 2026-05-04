"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { Trash2 } from "lucide-react";

import { Container } from "@/components/theme/container";
import { DisplayHeading, SectionLabel } from "@/components/theme/heading";
import { Lead } from "@/components/theme/paragraph";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { categoryLabel } from "@/lib/category-labels";
import type { Locale } from "@/lib/i18n/config";
import { withLocale } from "@/lib/i18n/config";
import { getUi } from "@/lib/i18n/ui";
import {
  deleteHistoryEntry,
  loadHistory,
  type HistoryEntry,
} from "@/lib/history-storage";
import { cn } from "@/lib/utils";

export function HistoryClient({ locale }: { locale: Locale }) {
  const ui = getUi(locale);
  const [rows, setRows] = useState<HistoryEntry[]>(() => loadHistory());

  return (
    <Container>
      <div className="sidefolio-section">
        <div className="space-y-2">
          <SectionLabel>{ui.history.sectionLabel}</SectionLabel>
          <DisplayHeading className="text-2xl sm:text-3xl">{ui.history.title}</DisplayHeading>
          <Lead>{ui.history.lead}</Lead>
        </div>
        {rows.length === 0 ? (
          <Card className="sidefolio-card">
            <CardHeader>
              <CardTitle>{ui.history.emptyTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{ui.history.emptyDesc}</p>
              <Link
                href={withLocale(locale, "/try")}
                className={cn(
                  buttonVariants({ variant: "cta" }),
                  "cursor-pointer rounded-xl shadow-sm",
                )}
              >
                {ui.history.startTryOn}
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((row) => (
              <Card key={row.id} className="sidefolio-card overflow-hidden">
                <div className="relative aspect-[3/4] bg-muted">
                  <Image
                    src={row.resultDataUrl}
                    alt={ui.history.previewAlt}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-muted-foreground">{categoryLabel(row.category, locale)}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(row.createdAt).toLocaleString(locale === "zh" ? "zh-CN" : "en-US")}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={row.resultDataUrl}
                      download={`tryon-${row.id}.png`}
                      className={cn(
                        buttonVariants({ variant: "secondary", size: "sm" }),
                        "flex-1 rounded-xl text-center",
                      )}
                    >
                      {ui.history.download}
                    </a>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="cursor-pointer gap-1 rounded-xl border-border"
                      onClick={() => {
                        setRows(deleteHistoryEntry(row.id));
                      }}
                    >
                      <Trash2 className="size-4" aria-hidden />
                      {ui.history.delete}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
