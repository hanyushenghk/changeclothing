"use client";

import Link from "next/link";

import Image from "next/image";

import { AlertTriangle, Loader2, Sparkles, Wand2 } from "lucide-react";

import { useGame } from "@/context/game-context";
import { Container } from "@/components/theme/container";
import { DisplayHeading, SectionLabel } from "@/components/theme/heading";
import { Lead } from "@/components/theme/paragraph";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageDropZone } from "@/components/try-on/image-drop-zone";
import type { Locale } from "@/lib/i18n/config";
import { withLocale } from "@/lib/i18n/config";
import { getUi } from "@/lib/i18n/ui";
import { cn } from "@/lib/utils";

export function TryOnWorkspace({ locale }: { locale: Locale }) {
  const ui = getUi(locale);
  const {
    personPreviewUrl,
    garmentPreviewUrl,
    phase,
    categoryDisplay,
    detectionSource,
    result,
    error,
    setPersonFile,
    setGarmentFile,
    generate,
    clearResult,
    resetSession,
    personFile,
    garmentFile,
  } = useGame();

  const busy = phase === "detecting" || phase === "generating";
  const canGenerate = Boolean(personFile && garmentFile && phase === "ready");

  return (
    <Container>
      <div className="sidefolio-section">
        <div className="space-y-3">
          <SectionLabel>{ui.tryOn.sectionLabel}</SectionLabel>
          <DisplayHeading>{ui.tryOn.title}</DisplayHeading>
          <Lead>{ui.tryOn.lead}</Lead>
          <p className="text-lg font-medium text-foreground">{ui.tryOn.freeTries}</p>
        </div>

        <Alert className="sidefolio-card rounded-xl border-border">
          <AlertTriangle className="size-4" aria-hidden />
          <AlertTitle>{ui.tryOn.refOnlyTitle}</AlertTitle>
          <AlertDescription>{ui.tryOn.refOnlyDesc}</AlertDescription>
        </Alert>

        {error ? (
          <Alert variant="destructive" className="rounded-xl border-destructive/30 bg-destructive/5">
            <AlertTitle>{ui.tryOn.errorTitle}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="sidefolio-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="size-4" aria-hidden />
                {ui.tryOn.uploadCardTitle}
              </CardTitle>
              <CardDescription>{ui.tryOn.uploadCardDesc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="sidefolio-card relative overflow-hidden border-dashed">
                  <GlowingEffect
                    disabled={false}
                    proximity={0}
                    inactiveZone={0}
                    spread={60}
                    movementDuration={0.45}
                    blur={4}
                    borderWidth={4}
                    glow
                    className="z-10 rounded-[inherit]"
                  />
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{ui.tryOn.yourPhoto}</CardTitle>
                    <CardDescription>{ui.tryOn.yourPhotoDesc}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ImageDropZone
                      label={ui.tryOn.personLabel}
                      description={ui.tryOn.personDesc}
                      replaceLabel={ui.tryOn.dropReplace}
                      uploadLabel={ui.tryOn.dropUpload}
                      formatsHint={ui.tryOn.dropFormats}
                      previewUrl={personPreviewUrl}
                      disabled={busy}
                      onFile={setPersonFile}
                    />
                  </CardContent>
                </Card>

                <Card className="sidefolio-card relative overflow-hidden border-dashed">
                  <GlowingEffect
                    disabled={false}
                    proximity={0}
                    inactiveZone={0}
                    spread={60}
                    movementDuration={0.45}
                    blur={4}
                    borderWidth={4}
                    glow
                    className="z-10 rounded-[inherit]"
                  />
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{ui.tryOn.clothingTitle}</CardTitle>
                    <CardDescription>{ui.tryOn.clothingDesc}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ImageDropZone
                      label={ui.tryOn.garmentLabel}
                      description={ui.tryOn.garmentDesc}
                      replaceLabel={ui.tryOn.dropReplace}
                      uploadLabel={ui.tryOn.dropUpload}
                      formatsHint={ui.tryOn.dropFormats}
                      previewUrl={garmentPreviewUrl}
                      disabled={busy}
                      onFile={setGarmentFile}
                    />
                  </CardContent>
                </Card>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">{ui.tryOn.detectedCategory}</span>
                {categoryDisplay ? (
                  <Badge variant="secondary" className="rounded-md bg-muted text-foreground">
                    {categoryDisplay}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="rounded-md border-border text-muted-foreground">
                    {ui.tryOn.waitingCategory}
                  </Badge>
                )}
                {detectionSource ? (
                  <span className="text-xs text-muted-foreground">
                    (
                    {detectionSource === "gemini" ? ui.tryOn.visionModel : ui.tryOn.localFallback}
                    )
                  </span>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="cta"
                  className="cursor-pointer gap-2 rounded-xl shadow-sm"
                  disabled={!canGenerate || busy}
                  onClick={() => void generate()}
                >
                  {phase === "generating" ? (
                    <>
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                      {ui.tryOn.generating}
                    </>
                  ) : (
                    <>
                      <Wand2 className="size-4" aria-hidden />
                      {ui.tryOn.generatePreview}
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="cursor-pointer rounded-xl border-border"
                  disabled={busy}
                  onClick={() => clearResult()}
                >
                  {ui.tryOn.clearResult}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="cursor-pointer rounded-xl"
                  onClick={() => resetSession()}
                >
                  {ui.tryOn.resetSession}
                </Button>
              </div>
              {phase === "detecting" ? (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  {ui.tryOn.detecting}
                </p>
              ) : null}
            </CardContent>
          </Card>

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
              {result?.dataUrl ? (
                <>
                  {result.mode === "placeholder" ? (
                    <Alert className="rounded-xl border-border bg-muted/50">
                      <AlertTitle>{ui.tryOn.placeholderTitle}</AlertTitle>
                      <AlertDescription>
                        {(() => {
                          const [before, after = ""] = ui.tryOn.placeholderDesc.split(".env.example");
                          return (
                            <>
                              {before}
                              <code>.env.example</code>
                              {after}
                            </>
                          );
                        })()}
                      </AlertDescription>
                    </Alert>
                  ) : null}
                  <div className="overflow-hidden rounded-xl border bg-muted/30">
                    <Image
                      src={result.dataUrl}
                      alt={ui.tryOn.previewAlt}
                      width={900}
                      height={1200}
                      className="w-full object-contain"
                      unoptimized
                    />
                  </div>
                  <a
                    href={result.dataUrl}
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
        </div>
      </div>
    </Container>
  );
}
