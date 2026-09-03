import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChartBar, KeyRound, Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SwitchRow } from "@/components/field-row";
import { useConsent } from "@/hooks/use-consent";
import {
  ACCEPT_ALL_CHOICES,
  REFUSE_ALL_CHOICES,
  type ConsentChoices,
} from "@/lib/consent";

function PreferencesForm() {
  const { t } = useTranslation();
  const { consent, hasDecided, accept, closePreferences } = useConsent();
  const [choices, setChoices] = useState<ConsentChoices>(() => ({
    google: consent?.categories.google ?? false,
    analytics: consent?.categories.analytics ?? false,
  }));

  const setChoice = (key: keyof ConsentChoices) => (checked: boolean) =>
    setChoices((previous) => ({ ...previous, [key]: checked }));

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t("consent.preferences.title")}</DialogTitle>
        <DialogDescription>
          {t("consent.preferences.description")}{" "}
          <Link
            to="/legal/cookies"
            target="_blank"
            rel="noopener"
            className="text-primary underline-offset-4 hover:underline"
          >
            {t("consent.policyLink")}
          </Link>
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-2">
        <SwitchRow
          id="consent-necessary"
          icon={Lock}
          label={t("consent.categories.necessary.label")}
          summary={t("consent.categories.necessary.description")}
          checked
          disabled
          onCheckedChange={() => undefined}
        />
        <SwitchRow
          id="consent-google"
          icon={KeyRound}
          label={t("consent.categories.google.label")}
          summary={t("consent.categories.google.description")}
          checked={choices.google}
          onCheckedChange={setChoice("google")}
        />
        <SwitchRow
          id="consent-analytics"
          icon={ChartBar}
          label={t("consent.categories.analytics.label")}
          summary={t("consent.categories.analytics.description")}
          checked={choices.analytics}
          onCheckedChange={setChoice("analytics")}
        />
      </div>

      <DialogFooter className="sm:flex-col sm:items-stretch">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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
        </div>
        <Button
          type="button"
          className="min-h-11 lg:min-h-10"
          onClick={() => accept(choices)}
        >
          {t("consent.actions.saveChoices")}
        </Button>
        {hasDecided && (
          <Button
            type="button"
            variant="ghost"
            className="min-h-11 lg:min-h-10"
            onClick={closePreferences}
          >
            {t("consent.actions.keepCurrent")}
          </Button>
        )}
      </DialogFooter>
    </>
  );
}

export function ConsentPreferencesDialog() {
  const { preferencesOpen } = useConsent();

  return (
    <Dialog open={preferencesOpen}>
      <DialogContent
        hideClose
        onPointerDownOutside={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <PreferencesForm />
      </DialogContent>
    </Dialog>
  );
}
