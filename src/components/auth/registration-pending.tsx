import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Loader2, MailCheck, MailWarning } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useToast } from "@/app/toast-context";
import { ApiError } from "@/lib/api-error";
import { formatDateTime } from "@/lib/date";
import { useResendRegistration, type RegistrationPending } from "@/features/auth";

interface PendingState {
  pending: RegistrationPending;
  receivedAt: number;
  source: "register" | "resend";
}

interface RegistrationPendingCardProps {
  pending: RegistrationPending;
  onRestart: () => void;
}

function useRemainingSeconds(deadline: number): number {
  const [now, setNow] = useState(() => Date.now());
  const remaining = Math.max(0, Math.ceil((deadline - now) / 1000));

  useEffect(() => {
    if (deadline <= Date.now()) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [deadline]);

  return remaining;
}

export function RegistrationPendingCard({
  pending,
  onRestart,
}: RegistrationPendingCardProps) {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const resend = useResendRegistration();
  const [state, setState] = useState<PendingState>(() => ({
    pending,
    receivedAt: Date.now(),
    source: "register",
  }));

  const current = state.pending;
  const deadline = state.receivedAt + current.retryAfterSeconds * 1000;
  const remaining = useRemainingSeconds(deadline);
  const noPending =
    state.source === "resend" &&
    !current.emailSent &&
    current.retryAfterSeconds === 0;

  const handleResend = () => {
    resend.mutate(
      { email: current.email },
      {
        onSuccess: (next) => {
          setState({ pending: next, receivedAt: Date.now(), source: "resend" });
        },
        onError: (err) => {
          if (err instanceof ApiError && err.status === 429) {
            toast.error(t("auth.register.rateLimited"));
          } else {
            toast.error(t("common.error"));
          }
        },
      }
    );
  };

  let notice: { variant: "success" | "warning"; text: string } | null = null;
  if (noPending) {
    notice = { variant: "warning", text: t("auth.register.pending.noPending") };
  } else if (current.emailSent) {
    notice =
      state.source === "resend"
        ? { variant: "success", text: t("auth.register.pending.resent") }
        : null;
  } else if (remaining > 0) {
    notice = {
      variant: "warning",
      text: t("auth.register.pending.alreadySent", { count: remaining }),
    };
  } else {
    notice = {
      variant: "warning",
      text: t("auth.register.pending.alreadySentReady"),
    };
  }

  const expiresAt =
    !noPending && current.expiresAt
      ? formatDateTime(current.expiresAt, i18n.language)
      : "";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">
          {t("auth.register.pending.title")}
        </CardTitle>
        <CardDescription>{t("auth.register.pending.sentTo")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-3">
          <MailCheck className="mt-0.5 size-5 shrink-0 text-primary" />
          <div className="min-w-0 text-sm">
            <p className="truncate font-medium text-foreground">
              {current.email}
            </p>
            <p className="text-muted-foreground">
              {t("auth.register.pending.hint")}
            </p>
            {expiresAt && (
              <p className="mt-1 text-xs text-muted-foreground">
                {t("auth.register.pending.expiresAt", { date: expiresAt })}
              </p>
            )}
          </div>
        </div>

        {notice && (
          <Alert variant={notice.variant} role="status">
            {notice.variant === "success" ? <CheckCircle2 /> : <MailWarning />}
            <AlertDescription>{notice.text}</AlertDescription>
          </Alert>
        )}

        {noPending ? (
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              className="min-h-11 w-full"
              onClick={onRestart}
            >
              {t("auth.register.pending.restart")}
            </Button>
            <Button asChild variant="outline" className="min-h-11 w-full">
              <Link to="/login">{t("auth.register.signIn")}</Link>
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="min-h-11 w-full"
            disabled={resend.isPending || remaining > 0}
            onClick={handleResend}
          >
            {resend.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <MailCheck className="size-4" />
            )}
            {resend.isPending
              ? t("auth.register.pending.resending")
              : remaining > 0
                ? t("auth.register.pending.retryIn", { count: remaining })
                : t("auth.register.pending.resend")}
          </Button>
        )}

        {!noPending && (
          <div className="flex flex-wrap justify-center gap-x-2 text-center text-sm text-muted-foreground">
            <button
              type="button"
              onClick={onRestart}
              className="min-h-10 text-primary underline-offset-4 hover:underline"
            >
              {t("auth.register.pending.changeEmail")}
            </button>
            <Link
              to="/login"
              className="inline-flex min-h-10 items-center text-primary hover:underline"
            >
              {t("auth.register.signIn")}
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
