"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Container } from "@/components/theme/container";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isLocale, withLocale, type Locale } from "@/lib/i18n/config";
import { getUi } from "@/lib/i18n/ui";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export default function ResetPasswordPage() {
  const params = useParams<{ locale: string }>();
  const raw = params.locale;
  const locale: Locale = raw && isLocale(raw) ? raw : "en";
  const ui = getUi(locale).resetPassword;

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
      const hashParams = new URLSearchParams(hash);
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

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
      setError(ui.errorInvalidLink);
      return;
    }

    if (password.length < 6) {
      setError(ui.errorShort);
      return;
    }

    if (password !== confirmPassword) {
      setError(ui.errorMismatch);
      return;
    }

    setBusy(true);
    const { error: updateErr } = await supabase.auth.updateUser({ password });
    setBusy(false);

    if (updateErr) {
      setError(updateErr.message);
      return;
    }

    setInfo(ui.success);
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <Container>
      <div className="sidefolio-section">
        <Card className="mx-auto w-full max-w-lg">
          <CardHeader>
            <CardTitle>{ui.title}</CardTitle>
            <CardDescription>{ui.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error ? (
              <Alert variant="destructive">
                <AlertTitle>{ui.errorTitle}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            {info ? (
              <Alert>
                <AlertTitle>{ui.successTitle}</AlertTitle>
                <AlertDescription>{info}</AlertDescription>
              </Alert>
            ) : null}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">{ui.newPassword}</Label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={busy}
                  placeholder={ui.placeholder}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">{ui.confirmPassword}</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={busy}
                  placeholder={ui.confirmPlaceholder}
                />
              </div>
              <div className="flex items-center gap-2">
                <Button type="submit" disabled={busy} className="gap-2">
                  {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                  {ui.submit}
                </Button>
                <Link href={withLocale(locale, "/")} className={cn(buttonVariants({ variant: "ghost" }))}>
                  {ui.backHome}
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
