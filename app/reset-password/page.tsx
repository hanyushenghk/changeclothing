"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/theme/container";
import { cn } from "@/lib/utils";

export default function ResetPasswordPage() {
  const [supabase] = useState(() => createBrowserSupabaseClient());
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const parseHashAndSetSession = async () => {
      const hash = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : window.location.hash;
      const params = new URLSearchParams(hash);
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");

      if (accessToken && refreshToken) {
        const { error: setErr } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (setErr && mounted) {
          setError(setErr.message);
          return;
        }
      }

      const { data } = await supabase.auth.getSession();
      if (mounted) {
        setReady(Boolean(data.session));
      }
    };

    void parseHashAndSetSession();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!ready) {
      setError("重置链接无效或已过期，请重新发起“忘记密码”。");
      return;
    }

    if (password.length < 6) {
      setError("新密码至少 6 位。");
      return;
    }

    if (password !== confirmPassword) {
      setError("两次输入的密码不一致。");
      return;
    }

    setBusy(true);
    const { error: updateErr } = await supabase.auth.updateUser({ password });
    setBusy(false);

    if (updateErr) {
      setError(updateErr.message);
      return;
    }

    setInfo("密码已重置成功，请返回首页重新登录。");
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <Container>
      <div className="sidefolio-section">
        <Card className="mx-auto w-full max-w-lg">
          <CardHeader>
            <CardTitle>重置密码</CardTitle>
            <CardDescription>
              请输入新密码。若提示链接失效，请返回首页重新点击“忘记密码”发送新邮件。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error ? (
              <Alert variant="destructive">
                <AlertTitle>错误</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            {info ? (
              <Alert>
                <AlertTitle>成功</AlertTitle>
                <AlertDescription>{info}</AlertDescription>
              </Alert>
            ) : null}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">新密码</Label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={busy}
                  placeholder="至少 6 位"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">确认新密码</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={busy}
                  placeholder="再次输入新密码"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button type="submit" disabled={busy} className="gap-2">
                  {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                  更新密码
                </Button>
                <Link href="/" className={cn(buttonVariants({ variant: "ghost" }))}>
                  返回首页
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
