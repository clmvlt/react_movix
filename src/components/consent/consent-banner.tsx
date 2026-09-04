import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Cookie, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConsent } from "@/hooks/use-consent";
import { ACCEPT_ALL_CHOICES, REFUSE_ALL_CHOICES } from "@/lib/consent";
import { ConsentPreferencesDialog } from "./consent-preferences-dialog";

const TITLE_ID = "consent-banner-title";
const DESCRIPTION_ID = "consent-banner-description";

export function ConsentBanner() {
  const { t } = useTranslation();
  const { hasDecided, preferencesOpen, accept, openPreferences } = useConsent();
  const visible = !hasDecided && !preferencesOpen;

  return (
    <>
      {visible && (
        <div aria-hidden className="fixed inset-0 z-50 bg-black/50" />
      )}
      {visible && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={TITLE_ID}
          aria-describedby={DESCRIPTION_ID}
          className="fixed inset-x-0 bottom-0 z-50 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:inset-x-auto sm:bottom-4 sm:left-1/2 sm:w-105 sm:max-w-[calc(100vw-2rem)] sm:-translate-x-1/2 sm:p-0"
        >
          <div className="rounded-lg border border-border bg-card p-4 shadow-lg">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
                <Cookie className="size-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p id={TITLE_ID} className="text-sm font-semibold text-foreground">
                  {t("consent.banner.title")}
                </p>
                <p
                  id={DESCRIPTION_ID}
                  className="mt-1 text-sm text-muted-foreground"
                >
                  {t("consent.banner.description")}{" "}
                  <Link
                    to="/legal/cookies"
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    {t("consent.policyLink")}
                  </Link>
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                className="min-h-11 lg:min-h-10"
                onClick={() => accept(REFUSE_ALL_CHOICES)}
              >
                {t("consent.actions.refuse")}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 lg:min-h-10"
                onClick={() => accept(ACCEPT_ALL_CHOICES)}
              >
                {t("consent.actions.acceptAll")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="min-h-11 sm:col-span-2 lg:min-h-10"
                onClick={openPreferences}
              >
                <SlidersHorizontal className="size-4" aria-hidden />
                {t("consent.actions.customize")}
              </Button>
            </div>
          </div>
        </div>
      )}
      <ConsentPreferencesDialog />
    </>
  );
}
