"use client";

import { useCallback, useEffect, useState } from "react";

import type { Session } from "@supabase/supabase-js";
import Turnstile from "react-turnstile";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { usernameToAuthEmail } from "@/lib/auth/username-email";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, X } from "lucide-react";

type Mode = "register" | "login" | null;

function getSupabaseOrNull() {
  try {
    return createBrowserSupabaseClient();
  } catch {
    return null;
  }
}

export function HomeAuth() {
  const [supabase] = useState(() => getSupabaseOrNull());
  const [session, setSession] = useState<Session | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [mode, setMode] = useState<Mode>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";

  const refreshSession = useCallback(async () => {
    if (!supabase) {
      setSession(null);
      setLoadingSession(false);

      return;
    }

    const { data } = await supabase.auth.getSession();

    setSession(data.session ?? null);
    setLoadingSession(false);
  }, [supabase]);

  useEffect(() => {
    void refreshSession();

    if (!supabase) {
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, refreshSession]);

  const closeModal = () => {
    setMode(null);
    setError(null);
    setPassword("");
    setCaptchaToken(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!supabase) {
      setError("Supabase 未配置：请在 .env.local 中填写 NEXT_PUBLIC_SUPABASE_URL 与 NEXT_PUBLIC_SUPABASE_ANON_KEY。");

      return;
    }

    const u = username.trim();

    if (u.length < 2) {
      setError("用户名至少 2 个字符。");

      return;
    }

    if (password.length < 6) {
      setError("密码至少 6 位（与 Supabase 项目策略一致，可在控制台调整）。");

      return;
    }

    if (turnstileSiteKey && !captchaToken) {
      setError("请先完成人机验证。");

      return;
    }

    setBusy(true);
    setInfo(null);

    try {
      if (turnstileSiteKey) {
        const verifyRes = await fetch("/api/turnstile/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: captchaToken,
          }),
        });
        const verifyJson = (await verifyRes.json()) as { error?: string };

        if (!verifyRes.ok) {
          throw new Error(verifyJson.error ?? "人机验证未通过，请重试。");
        }
      }

      const email = await usernameToAuthEmail(u);

      if (mode === "register") {
        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
          email,
          password,
          options: {
            captchaToken: captchaToken ?? undefined,
            data: {
              userid: u,
              name: u,
            },
          },
        });

        if (signUpErr) {
          throw signUpErr;
        }

        if (signUpData.user && !signUpData.session) {
          closeModal();
          setInfo(
            "注册已提交。若你在 Supabase 开启了「邮箱确认」，请前往邮箱完成验证后再登录；若已关闭确认，请直接点击登录。",
          );
          setBusy(false);

          return;
        }
      } else if (mode === "login") {
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email,
          password,
          options: {
            captchaToken: captchaToken ?? undefined,
          },
        });

        if (signInErr) {
          throw signInErr;
        }
      }

      closeModal();
      await refreshSession();
      if (mode === "register") {
        setInfo("注册成功，已登录。");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "操作失败";

      setError(message);
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    if (!supabase) {
      return;
    }

    setBusy(true);
    await supabase.auth.signOut();
    setSession(null);
    setInfo(null);
    setBusy(false);
  };

  if (!supabase) {
    return (
      <Alert variant="destructive" className="max-w-xl">
        <AlertTitle>未连接 Supabase</AlertTitle>
        <AlertDescription>
          请在 .env.local 中配置 NEXT_PUBLIC_SUPABASE_URL 与 NEXT_PUBLIC_SUPABASE_ANON_KEY 后刷新页面。
        </AlertDescription>
      </Alert>
    );
  }

  const displayName =
    session?.user.user_metadata?.name
    ?? session?.user.user_metadata?.userid
    ?? session?.user.email
    ?? "用户";

  return (
    <div className="space-y-4">
      {info ? (
        <Alert className="max-w-xl border-primary/50 bg-primary/5">
          <AlertTitle>提示</AlertTitle>
          <AlertDescription>{info}</AlertDescription>
        </Alert>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        {loadingSession ? (
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            加载登录状态…
          </span>
        ) : session ? (
          <>
            <p className="text-sm text-muted-foreground">
              已登录：<span className="font-medium text-foreground">{String(displayName)}</span>
            </p>
            <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => void handleSignOut()}>
              退出
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setMode("register");
                setError(null);
                setInfo(null);
              }}
            >
              注册
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setMode("login");
                setError(null);
                setInfo(null);
              }}
            >
              登录
            </Button>
          </>
        )}
      </div>

      {mode ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeModal();
            }
          }}
        >
          <Card className="relative w-full max-w-md shadow-lg" role="dialog" aria-modal="true" aria-labelledby="auth-title">
            <button
              type="button"
              className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={closeModal}
              aria-label="关闭"
            >
              <X className="size-4" />
            </button>
            <CardHeader>
              <CardTitle id="auth-title">{mode === "register" ? "注册账号" : "登录"}</CardTitle>
              <CardDescription>
                {mode === "register"
                  ? "设置用户名与密码。用户名支持中文；系统将安全映射为登录账号。"
                  : "输入注册时的用户名与密码。"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
                {error ? (
                  <Alert variant="destructive">
                    <AlertTitle>错误</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : null}
                <div className="space-y-2">
                  <Label htmlFor="auth-username">用户名</Label>
                  <Input
                    id="auth-username"
                    name="username"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="例如：zhangsan"
                    disabled={busy}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="auth-password">密码</Label>
                  <Input
                    id="auth-password"
                    name="password"
                    type="password"
                    autoComplete={mode === "register" ? "new-password" : "current-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="至少 6 位"
                    disabled={busy}
                  />
                </div>
                {turnstileSiteKey ? (
                  <div className="space-y-2">
                    <Label>人机验证</Label>
                    <Turnstile
                      sitekey={turnstileSiteKey}
                      theme="light"
                      onVerify={(token) => {
                        setCaptchaToken(token);
                        setError(null);
                      }}
                      onExpire={() => setCaptchaToken(null)}
                      onError={() => {
                        setCaptchaToken(null);
                        setError("人机验证失败，请重试。");
                      }}
                    />
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    未配置 <code>NEXT_PUBLIC_TURNSTILE_SITE_KEY</code>，当前跳过人机验证。
                  </p>
                )}
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" disabled={busy} onClick={closeModal}>
                    取消
                  </Button>
                  <Button type="submit" disabled={busy} className="gap-2">
                    {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                    {mode === "register" ? "注册" : "登录"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
