"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";

import { Loader2, Sparkles } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type GenerateResponse = {
  imageUrl?: string;
  error?: string;
  saved?: boolean;
};

export function HomeAIGenerator() {
  const supabase = createBrowserSupabaseClient();
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const text = prompt.trim();
    if (!text) {
      setError("请输入提示词（prompt）。");
      return;
    }

    setBusy(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const accessToken = session?.access_token ?? "";

      const res = await fetch("/api/images/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ prompt: text }),
      });
      const json = (await res.json()) as GenerateResponse;

      if (!res.ok || !json.imageUrl) {
        throw new Error(json.error ?? "生成失败，请稍后重试。");
      }

      setImageUrl(json.imageUrl);
      if (json.saved === false) {
        setError("未登录：图片已生成并上传，但不会保存到你的历史记录。");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成失败，请稍后重试。");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="sidefolio-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="size-4" aria-hidden />
          AI Image to R2 Demo
        </CardTitle>
        <CardDescription>输入提示词后，后端会生成图片并保存到 R2，再返回永久链接。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="home-ai-prompt">Prompt</Label>
            <Input
              id="home-ai-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="例如：a minimalist fashion portrait in soft light"
              disabled={busy}
            />
          </div>
          <Button type="submit" disabled={busy} className="gap-2">
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            Generate and Save
          </Button>
        </form>

        {error ? (
          <Alert variant="destructive">
            <AlertTitle>错误</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {imageUrl ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              永久链接：{" "}
              <a href={imageUrl} target="_blank" rel="noreferrer" className="underline">
                打开图片
              </a>
            </p>
            <div className="overflow-hidden rounded-lg border bg-muted/20">
              <Image src={imageUrl} alt="Generated image" width={1024} height={1024} className="w-full object-contain" unoptimized />
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
