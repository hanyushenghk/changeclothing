"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { Session } from "@supabase/supabase-js";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { usernameToAuthEmail } from "@/lib/auth/username-email";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, X } from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { getAuthMessages } from "@/lib/i18n/auth-messages";
import type { Locale } from "@/lib/i18n/config";
import { withLocale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

type Mode = "register" | "login" | "forgot" | null;

function getSupabaseOrNull() {
  try {
    return createBrowserSupabaseClient();
  } catch {
    return null;
  }
}

type OAuthProviderId = "github" | "google";

const OAUTH_LABEL: Record<OAuthProviderId, string> = {
  github: "GitHub",
  google: "Google",
};

function GitHubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-4 shrink-0", className)} aria-hidden>
      <path
        fill="currentColor"
        d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
      />
    </svg>
  );
}

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={cn("size-4 shrink-0", className)} aria-hidden>
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4c-7.682 0-14.344 4.337-17.694 10.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.197l-6.181-5.197C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.099 5.571c.001-.001.002-.001.003-.002l6.181 5.197C36.554 39.254 44 33.111 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}

export function HomeAuth({ locale }: { locale: Locale }) {
  const m = getAuthMessages(locale);

  const Turnstile = useMemo(
    () =>
      dynamic(() => import("react-turnstile"), {
        ssr: false,
        loading: () => <p className="text-xs text-muted-foreground">{m.turnstileLoading}</p>,
      }),
    [m.turnstileLoading],
  );

  const [supabase] = useState(() => getSupabaseOrNull());
  const [session, setSession] = useState<Session | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [mode, setMode] = useState<Mode>(null);
  const [username, setUsername] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [oauthProviderBusy, setOauthProviderBusy] = useState<OAuthProviderId | null>(null);
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
    setOauthProviderBusy(null);
  };

  const triggerWelcomeEmail = useCallback((email: string, name: string) => {
    void fetch("/api/auth/send-welcome-email", {
      method: "POST",
      keepalive: true,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        name,
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null;
          console.warn("send welcome email failed:", body?.error ?? `status ${res.status}`);
        }
      })
      .catch((mailErr) => {
        console.warn("send welcome email failed:", mailErr);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!supabase) {
      setError(m.supabaseEnv);

      return;
    }

    const u = username.trim();
    const emailTyped = emailInput.trim().toLowerCase();

    if ((mode === "register" || mode === "login") && u.length < 2) {
      setError(m.usernameShort);

      return;
    }

    if ((mode === "register" || mode === "forgot") && !emailTyped) {
      setError(m.emailRequired);

      return;
    }

    if ((mode === "register" || mode === "forgot") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTyped)) {
      setError(m.emailInvalid);

      return;
    }

    if (mode !== "forgot" && password.length < 6) {
      setError(m.passwordShort);

      return;
    }

    if (turnstileSiteKey && !turnstileBypassed && !captchaToken) {
      setError(m.captchaRequired);

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
          const codes = verifyJson.codes?.length ? ` (${verifyJson.codes.join(", ")})` : "";
          throw new Error((verifyJson.error ?? m.captchaVerifyFail) + codes);
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

        triggerWelcomeEmail(email, u);

        if (signUpData.user && !signUpData.session) {
          closeModal();
          setInfo(m.registerPendingEmailVerify);
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
            ? `${window.location.origin}${withLocale(locale, "/reset-password")}`
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
          throw new Error(forgotJson.error ?? m.forgotSendFail);
        }

        closeModal();
        setInfo(forgotJson.bypassed ? m.forgotBypassInfo : m.forgotSentInfo);
        return;
      }

      closeModal();
      await refreshSession();
      if (mode === "register") {
        setInfo(m.registerSuccessLoggedIn);
      }
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : m.opFailed;
      const failedToFetch = rawMessage.toLowerCase().includes("failed to fetch");
      const message = failedToFetch && mode === "forgot" ? m.forgotNetworkFail : rawMessage;

      setError(message);
      setCaptchaToken(null);
      setCaptchaKey((n) => n + 1);
    } finally {
      setBusy(false);
    }
  };

  const handleOAuthSignIn = async (provider: OAuthProviderId) => {
    if (!supabase) {
      return;
    }

    setError(null);
    setOauthProviderBusy(provider);

    try {
      const next = typeof window !== "undefined" ? `${window.location.pathname}${window.location.search}` : "/";
      const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNext)}`;

      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
        },
      });

      if (oauthError) {
        throw oauthError;
      }

      if (data.url) {
        window.location.assign(data.url);
        return;
      }

      throw new Error(m.oauthNoUrl(OAUTH_LABEL[provider]));
    } catch (err) {
      const label = OAUTH_LABEL[provider];
      const msg = err instanceof Error ? err.message : m.oauthFail(label);
      setError(msg);
      setOauthProviderBusy(null);
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
        <AlertTitle>{m.notConnectedTitle}</AlertTitle>
        <AlertDescription>{m.notConnectedDesc}</AlertDescription>
      </Alert>
    );
  }

  const displayName =
    session?.user.user_metadata?.name
    ?? session?.user.user_metadata?.userid
    ?? session?.user.email
    ?? m.userFallback;

  return (
    <div className="space-y-4">
      {info ? (
        <Alert className="max-w-xl border-primary/50 bg-primary/5">
          <AlertTitle>{m.noticeTitle}</AlertTitle>
          <AlertDescription>{info}</AlertDescription>
        </Alert>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        {loadingSession ? (
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            {m.loadingSession}
          </span>
        ) : session ? (
          <>
            <p className="text-sm text-muted-foreground">
              {m.signedInPrefix} <span className="font-medium text-foreground">{String(displayName)}</span>
            </p>
            <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => void handleSignOut()}>
              {m.signOut}
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
              {m.register}
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
              {m.login}
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
          {m.forgotPassword}
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
          <Card
            className="relative w-full max-w-md shadow-lg"
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-title"
          >
            <button
              type="button"
              className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={closeModal}
              aria-label={m.closeAria}
            >
              <X className="size-4" />
            </button>
            <CardHeader>
              <CardTitle id="auth-title">
                {mode === "register" ? m.modalTitleRegister : mode === "login" ? m.modalTitleLogin : m.modalTitleForgot}
              </CardTitle>
              <CardDescription>
                {mode === "register"
                  ? m.modalDescRegister
                  : mode === "login"
                    ? m.modalDescLogin
                    : m.modalDescForgot}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {mode === "login" || mode === "register" ? (
                <>
                  <div className="grid gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full gap-2 rounded-xl border-border"
                      disabled={busy || oauthProviderBusy !== null}
                      onClick={() => void handleOAuthSignIn("github")}
                    >
                      {oauthProviderBusy === "github" ? (
                        <Loader2 className="size-4 animate-spin" aria-hidden />
                      ) : (
                        <GitHubMark />
                      )}
                      {m.useGithubLogin}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full gap-2 rounded-xl border-border"
                      disabled={busy || oauthProviderBusy !== null}
                      onClick={() => void handleOAuthSignIn("google")}
                    >
                      {oauthProviderBusy === "google" ? (
                        <Loader2 className="size-4 animate-spin" aria-hidden />
                      ) : (
                        <GoogleMark />
                      )}
                      {m.useGoogleLogin}
                    </Button>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <Separator className="flex-1" />
                    <span>{mode === "register" ? m.orUseEmailRegister : m.orUseEmailLogin}</span>
                    <Separator className="flex-1" />
                  </div>
                </>
              ) : null}
              <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
                {error ? (
                  <Alert variant="destructive">
                    <AlertTitle>{m.errorTitle}</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : null}
                {mode !== "forgot" ? (
                  <div className="space-y-2">
                    <Label htmlFor="auth-username">
                      {mode === "login" ? m.labelAccountLogin : m.labelUsername}
                    </Label>
                    <Input
                      id="auth-username"
                      name="username"
                      autoComplete="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder={mode === "login" ? m.placeholderAccountLogin : m.placeholderUsername}
                      disabled={busy}
                    />
                  </div>
                ) : null}
                {mode === "register" || mode === "forgot" ? (
                  <div className="space-y-2">
                    <Label htmlFor="auth-email">{m.labelEmail}</Label>
                    <Input
                      id="auth-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder={m.placeholderEmail}
                      disabled={busy}
                    />
                  </div>
                ) : null}
                {mode !== "forgot" ? (
                  <div className="space-y-2">
                    <Label htmlFor="auth-password">{m.labelPassword}</Label>
                    <Input
                      id="auth-password"
                      name="password"
                      type="password"
                      autoComplete={mode === "register" ? "new-password" : "current-password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={m.passwordPlaceholder}
                      disabled={busy}
                    />
                  </div>
                ) : null}
                {turnstileSiteKey ? (
                  <div className="space-y-2">
                    <Label>{m.labelCaptcha}</Label>
                    {turnstileBypassed ? (
                      <p className="text-xs text-muted-foreground">{m.turnstileBypassMsg}</p>
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
                          const isLocalBypassCase =
                            turnstileDevBypass && isLocalHost && String(code) === "110200";

                          if (isLocalBypassCase) {
                            setCaptchaToken("local-dev-bypass-token");
                            setError(null);
                            setInfo(m.turnstileLocalBypassInfo);
                            return;
                          }

                          setCaptchaToken(null);
                          setError(
                            `${m.turnstileFailPrefix}${code ? ` (${String(code)})` : ""}${m.turnstileFailSuffix}`,
                          );
                        }}
                      />
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {(() => {
                      const [before, after = ""] = m.turnstileSkipMsg.split("NEXT_PUBLIC_TURNSTILE_SITE_KEY");
                      return (
                        <>
                          {before}
                          <code>NEXT_PUBLIC_TURNSTILE_SITE_KEY</code>
                          {after}
                        </>
                      );
                    })()}
                  </p>
                )}
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy || oauthProviderBusy !== null}
                    onClick={closeModal}
                  >
                    {m.cancel}
                  </Button>
                  <Button type="submit" disabled={busy || oauthProviderBusy !== null} className="gap-2">
                    {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                    {mode === "register" ? m.submitRegister : mode === "login" ? m.submitLogin : m.submitForgot}
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
