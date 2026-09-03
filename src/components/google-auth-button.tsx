import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { config } from "@/lib/config";
import { loadGoogleIdentity } from "@/lib/google-identity";
import { useConsent } from "@/hooks/use-consent";
import { Button } from "@/components/ui/button";

interface GoogleAuthGate {
  blocked: boolean;
  onBlocked: () => void;
  label: string;
}

interface GoogleAuthButtonProps {
  onCredential: (idToken: string) => void;
  text?: "signin_with" | "continue_with";
  busy?: boolean;
  before?: ReactNode;
  unavailable?: ReactNode;
  gate?: GoogleAuthGate;
  className?: string;
}

function ConsentPlaceholder() {
  const { t } = useTranslation();
  const { hasDecided, openPreferences } = useConsent();

  return (
    <div className="flex flex-col items-center gap-2">
      <Button
        type="button"
        variant="outline"
        className="min-h-11 w-full max-w-100 lg:min-h-10"
        disabled
      >
        {t("consent.google.buttonLabel")}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        {hasDecided
          ? t("consent.google.disabled")
          : t("consent.google.undecided")}{" "}
        <button
          type="button"
          onClick={openPreferences}
          className="inline-flex min-h-8 items-center font-medium text-primary underline-offset-4 hover:underline"
        >
          {hasDecided ? t("consent.google.modify") : t("consent.google.choose")}
        </button>
      </p>
    </div>
  );
}

export function GoogleAuthButton({
  onCredential,
  text = "signin_with",
  busy = false,
  before,
  unavailable,
  gate,
  className,
}: GoogleAuthButtonProps) {
  const { i18n } = useTranslation();
  const { isAllowed } = useConsent();
  const allowed = isAllowed("google");
  const locale = i18n.resolvedLanguage ?? i18n.language ?? "fr";
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [failed, setFailed] = useState(false);
  const credentialRef = useRef(onCredential);

  useEffect(() => {
    credentialRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    if (!container || !allowed) return;
    let cancelled = false;
    loadGoogleIdentity()
      .then((api) => {
        if (cancelled) return;
        api.initialize({
          client_id: config.googleClientId,
          callback: (response) => credentialRef.current(response.credential),
        });
        const width = Math.round(container.clientWidth);
        container.replaceChildren();
        api.renderButton(container, {
          type: "standard",
          theme: "outline",
          size: "large",
          text,
          locale,
          width: width > 0 ? Math.min(400, Math.max(200, width)) : undefined,
        });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [container, allowed, locale, text]);

  if (failed) return unavailable ?? null;

  if (!allowed) {
    return (
      <div className={className}>
        {before}
        <ConsentPlaceholder />
      </div>
    );
  }

  const blocked = gate?.blocked === true;

  return (
    <div className={className}>
      {before}
      <div className="relative">
        <div
          ref={setContainer}
          inert={blocked || undefined}
          className={cn(
            "flex min-h-11 justify-center",
            busy && "pointer-events-none opacity-60",
            blocked && "opacity-60"
          )}
        />
        {blocked && gate && (
          <button
            type="button"
            className="absolute inset-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label={gate.label}
            onClick={gate.onBlocked}
          />
        )}
      </div>
    </div>
  );
}
