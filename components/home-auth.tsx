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

type Mode = "register" | "login" | "forgot" | null;

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
  const [emailInput, setEmailInput] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaKey, setCaptchaKey] = useState(0);
  const [isLocalHost, setIsLocalHost] = useState(false);
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";
  const turnstileDevBypass = process.env.NEXT_PUBLIC_TURNSTILE_DEV_BYPASS === "true";
  const turnstileBypassed = turnstileSiteKey && turnstileDevBypass && isLocalHost;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const host = window.location.hostname;
    setIsLocalHost(host === "127.0.0.1" || host === "localhost");
  }, []);

  useEffect(() => {
    if (mode && turnstileBypassed) {
      setCaptchaToken("local-dev-bypass-token");
    }
  }, [mode, turnstileBypassed]);

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
    setEmailInput("");
    setCaptchaToken(null);
    setCaptchaKey((n) => n + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!supabase) {
      setError("Supabase 未配置：请在 .env.local 中填写 NEXT_PUBLIC_SUPABASE_URL 与 NEXT_PUBLIC_SUPABASE_ANON_KEY。");

      return;
    }

    const u = username.trim();
    const emailTyped = emailInput.trim().toLowerCase();

    if ((mode === "register" || mode === "login") && u.length < 2) {
      setError("用户名/账号至少 2 个字符。");

      return;
    }

    if ((mode === "register" || mode === "forgot") && !emailTyped) {
      setError("请输入邮箱地址。");

      return;
    }

    if ((mode === "register" || mode === "forgot") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTyped)) {
      setError("请输入有效的邮箱地址。");

      return;
    }

    if (mode !== "forgot" && password.length < 6) {
      setError("密码至少 6 位（与 Supabase 项目策略一致，可在控制台调整）。");

      return;
    }

    if (turnstileSiteKey && !turnstileBypassed && !captchaToken) {
      setError("请先完成人机验证。");

      return;
    }

    setBusy(true);
    setInfo(null);

    try {
      if (turnstileSiteKey && !turnstileBypassed) {
        const verifyRes = await fetch("/api/turnstile/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: captchaToken,
          }),
        });
        const verifyJson = (await verifyRes.json()) as { error?: string; codes?: string[] };

        if (!verifyRes.ok) {
          const codes = verifyJson.codes?.length ? `（${verifyJson.codes.join(", ")}）` : "";
          throw new Error((verifyJson.error ?? "人机验证未通过，请重试。") + codes);
        }
      }

      const identifier = u.toLowerCase();
      const email =
        mode === "register" || mode === "forgot"
          ? emailTyped
          : identifier.includes("@")
            ? identifier
            : await usernameToAuthEmail(identifier);

      if (mode === "register") {
        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
          email,
          password,
          options: {
            captchaToken: captchaToken ?? undefined,
            data: {
              userid: u,
              name: u,
              email: emailTyped,
            },
          },
        });

        if (signUpErr) {
          throw signUpErr;
        }

        await fetch("/api/auth/send-welcome-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            name: u,
          }),
        }).catch((mailErr) => {
          console.warn("send welcome email failed:", mailErr);
        });

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
      } else if (mode === "forgot") {
        const redirectTo =
          typeof window !== "undefined"
            ? `${window.location.origin}/reset-password`
            : undefined;
        const forgotRes = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            redirectTo,
            captchaToken: captchaToken ?? undefined,
          }),
        });
        const forgotJson = (await forgotRes.json()) as { error?: string; bypassed?: boolean };

        if (!forgotRes.ok) {
          throw new Error(forgotJson.error ?? "发送重置邮件失败。");
        }

        closeModal();
        setInfo(
          forgotJson.bypassed
            ? "本地开发模式：已跳过实际邮件发送（网络不可达），流程验证通过。"
            : "已发送重置密码链接到该邮箱，请前往邮箱完成密码重置。",
        );
        return;
      }

      closeModal();
      await refreshSession();
      if (mode === "register") {
        setInfo("注册成功，已登录。");
      }
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : "操作失败";
      const failedToFetch = rawMessage.toLowerCase().includes("failed to fetch");
      const message =
        failedToFetch && mode === "forgot"
          ? "发送重置邮件失败：当前网络无法连接 Supabase（DNS/代理/VPN 问题）。请检查网络后重试。"
          : rawMessage;

      setError(message);
      setCaptchaToken(null);
      setCaptchaKey((n) => n + 1);
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
      {!loadingSession && !session ? (
        <button
          type="button"
          className="text-sm text-primary underline-offset-4 hover:underline"
          onClick={() => {
            setMode("forgot");
            setError(null);
            setInfo(null);
          }}
        >
          忘记密码？
        </button>
      ) : null}

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
              <CardTitle id="auth-title">
                {mode === "register" ? "注册账号" : mode === "login" ? "登录" : "找回密码"}
              </CardTitle>
              <CardDescription>
                {mode === "register"
                  ? "设置用户名、邮箱与密码。忘记密码时将向该邮箱发送重置链接。"
                  : mode === "login"
                    ? "输入邮箱或用户名，以及密码。"
                    : "输入你的邮箱，我们会向该邮箱发送密码重置链接。"}
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
                {mode !== "forgot" ? (
                  <div className="space-y-2">
                    <Label htmlFor="auth-username">
                      {mode === "login" ? "账号（邮箱或用户名）" : "用户名"}
                    </Label>
                    <Input
                      id="auth-username"
                      name="username"
                      autoComplete="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder={mode === "login" ? "例如：name@example.com 或 zhangsan" : "例如：zhangsan"}
                      disabled={busy}
                    />
                  </div>
                ) : null}
                {(mode === "register" || mode === "forgot") ? (
                  <div className="space-y-2">
                    <Label htmlFor="auth-email">邮箱</Label>
                    <Input
                      id="auth-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="例如：name@example.com"
                      disabled={busy}
                    />
                  </div>
                ) : null}
                {mode !== "forgot" ? (
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
                ) : null}
                {turnstileSiteKey ? (
                  <div className="space-y-2">
                    <Label>人机验证</Label>
                    {turnstileBypassed ? (
                      <p className="text-xs text-muted-foreground">
                        本地开发模式：已跳过 Turnstile 组件加载（使用开发兜底验证）。
                      </p>
                    ) : (
                      <Turnstile
                        key={captchaKey}
                        sitekey={turnstileSiteKey}
                        theme="light"
                        onVerify={(token) => {
                          setCaptchaToken(token);
                          setError(null);
                        }}
                        onExpire={() => setCaptchaToken(null)}
                        onError={(code) => {
                          const isLocalBypassCase = turnstileDevBypass && isLocalHost && String(code) === "110200";

                          if (isLocalBypassCase) {
                            setCaptchaToken("local-dev-bypass-token");
                            setError(null);
                            setInfo("本地开发模式：Turnstile 前端异常(110200)，已启用本地兜底验证。");
                            return;
                          }

                          setCaptchaToken(null);
                          setError(
                            `人机验证失败，请重试。${code ? `（${String(code)}）` : ""} 请确认 Turnstile 已允许当前域名（127.0.0.1 / localhost）。`,
                          );
                        }}
                      />
                    )}
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
                    {mode === "register" ? "注册" : mode === "login" ? "登录" : "发送重置链接"}
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
