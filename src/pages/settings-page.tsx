import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { LoadingState } from "@/components/states";
import { SettingsTabs, type SettingsTabItem } from "@/components/settings-tabs";
import {
  DEFAULT_TAB,
  isAccountTab,
  parseSettingsTab,
  visibleTabs,
  type SettingsTab,
} from "@/components/account/account-tabs";
import {
  buildAccountTabPatch,
  initialAccountForm,
  isAccountTabDirty,
  resetAccountTab,
  validateAccountTab,
  type AccountFormState,
} from "@/components/account/account-form";
import { AccountSaveBar } from "@/components/account/account-save-bar";
import { useApiErrorMessage } from "@/components/account/use-account-error";
import { AccountCompanyTab } from "@/components/account/account-company-tab";
import { AccountDepotTab } from "@/components/account/account-depot-tab";
import { AccountLabelsTab } from "@/components/account/account-labels-tab";
import { AccountEmailsTab } from "@/components/account/account-emails-tab";
import { EmailRecipientsCard } from "@/components/email/email-recipients-card";
import { EmailLogsCard } from "@/components/email/email-logs-card";
import { AccountSmtpTab } from "@/components/account/account-smtp-tab";
import { AccountOptionsTab } from "@/components/account/account-options-tab";
import { TarifsTab } from "@/components/tarifs/tarifs-tab";
import { BillingTab } from "@/components/billing/billing-tab";
import { AccountColorsTab } from "@/components/account-colors/account-colors-tab";
import { LabelSettingsTab } from "@/components/label-settings/label-settings-tab";
import { LEGAL_LINKS } from "@/components/legal/legal-links";
import { useConsent } from "@/hooks/use-consent";
import { useAuth } from "@/app/auth-context";
import { useToast } from "@/app/toast-context";
import { useAccountDetails, useUpdateAccount } from "@/features/account";

export function SettingsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { openPreferences } = useConsent();
  const toast = useToast();
  const isAdmin = user?.isAdmin === true;
  const errorMessage = useApiErrorMessage("account");

  const [searchParams, setSearchParams] = useSearchParams();
  const tab = parseSettingsTab(searchParams.get("tab"), isAdmin);

  const detailsQuery = useAccountDetails(isAdmin);
  const detail = detailsQuery.data ?? null;
  const updateAccount = useUpdateAccount();

  const [form, setForm] = useState<AccountFormState | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!detail) return;
    setForm((previous) => previous ?? initialAccountForm(detail));
  }, [detail]);

  const setTab = (next: SettingsTab) => {
    setSearchParams(
      (previous) => {
        const params = new URLSearchParams(previous);
        if (next === DEFAULT_TAB) params.delete("tab");
        else params.set("tab", next);
        return params;
      },
      { replace: true }
    );
  };

  const set = <K extends keyof AccountFormState>(
    key: K,
    value: AccountFormState[K]
  ) => {
    setForm((previous) => (previous ? { ...previous, [key]: value } : previous));
    setErrors((previous) => ({ ...previous, [key]: "" }));
  };

  const dirtyTabs = useMemo(() => {
    if (!form || !detail) return new Set<SettingsTab>();
    return new Set(
      visibleTabs(isAdmin)
        .map((item) => item.value)
        .filter(
          (value) => isAccountTab(value) && isAccountTabDirty(form, detail, value)
        )
    );
  }, [form, detail, isAdmin]);

  const tabItems: SettingsTabItem<SettingsTab>[] = visibleTabs(isAdmin).map(
    (item) => ({
      value: item.value,
      label: t(item.labelKey),
      icon: item.icon,
      dirty: dirtyTabs.has(item.value),
    })
  );

  const otherDirty = [...dirtyTabs].filter((value) => value !== tab);

  const handleSave = () => {
    if (!form || !detail) return;
    const nextErrors = validateAccountTab(form, tab, t);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    const patch = buildAccountTabPatch(form, detail, tab);
    if (Object.keys(patch).length === 0) {
      toast.warning(t("account.form.noChanges"));
      return;
    }
    updateAccount.mutate(patch, {
      onSuccess: (fresh) => {
        setForm((previous) =>
          previous ? resetAccountTab(previous, fresh, tab) : previous
        );
        toast.success(t("account.form.saved"));
      },
      onError: (error) => {
        toast.error(errorMessage(error, "account.errors.saveFailed"));
      },
    });
  };

  const handleReset = () => {
    if (!form || !detail) return;
    setForm(resetAccountTab(form, detail, tab));
    setErrors({});
  };

  const renderAccountTab = () => {
    if (detailsQuery.isLoading) return <LoadingState />;
    if (detailsQuery.isError) {
      return (
        <Alert variant="warning">
          <AlertDescription>
            {errorMessage(detailsQuery.error, "account.errors.loadFailed")}
          </AlertDescription>
        </Alert>
      );
    }
    if (!form || !detail) return <LoadingState />;

    const shared = {
      form,
      baseline: detail,
      errors,
      set,
      disabled: updateAccount.isPending,
    };

    const panel = (() => {
      switch (tab) {
        case "company":
          return <AccountCompanyTab {...shared} />;
        case "depot":
          return <AccountDepotTab {...shared} />;
        case "labels":
          return <AccountLabelsTab {...shared} />;
        case "emails":
          return <AccountEmailsTab {...shared} />;
        case "smtp":
          return <AccountSmtpTab {...shared} />;
        case "options":
          return <AccountOptionsTab {...shared} />;
        default:
          return null;
      }
    })();

    return (
      <div className="flex flex-col gap-4">
        {panel}
        <AccountSaveBar
          dirty={dirtyTabs.has(tab)}
          pending={updateAccount.isPending}
          onSave={handleSave}
          onReset={handleReset}
        />
        {tab === "emails" && (
          <>
            <EmailRecipientsCard />
            <EmailLogsCard />
          </>
        )}
      </div>
    );
  };

  const renderPanel = () => {
    if (tab === "labelLayout") return <LabelSettingsTab />;
    if (tab === "tarifs") return <TarifsTab />;
    if (tab === "billing") return <BillingTab />;
    if (tab === "colors") return <AccountColorsTab />;
    if (tab === "company" && !isAdmin) return <AccountCompanyTab readOnly />;
    return renderAccountTab();
  };

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title={t("settings.title")} subtitle={t("settings.subtitle")} />

      {otherDirty.length > 0 && (
        <Alert
          variant="warning"
          className="mb-4 flex flex-col items-start gap-2"
        >
          <AlertDescription>
            {t("account.form.unsavedElsewhere", {
              tabs: otherDirty
                .map((value) =>
                  t(
                    visibleTabs(isAdmin).find((item) => item.value === value)
                      ?.labelKey ?? ""
                  )
                )
                .join(", "),
            })}
          </AlertDescription>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-10"
            onClick={() => setTab(otherDirty[0])}
          >
            {t("account.form.goToTab")}
          </Button>
        </Alert>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-4 lg:flex-row lg:gap-6">
        <SettingsTabs
          items={tabItems}
          value={tab}
          onChange={setTab}
          idPrefix="settings"
        />
        <div
          role="tabpanel"
          id={`settings-panel-${tab}`}
          aria-labelledby={`settings-tab-${tab}`}
          className="flex min-w-0 flex-1 flex-col"
        >
          {renderPanel()}
        </div>
      </div>

      <nav
        aria-label={t("legal.navLabel")}
        className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-4 text-xs text-muted-foreground"
      >
        {LEGAL_LINKS.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="inline-flex min-h-8 items-center transition-colors hover:text-foreground"
          >
            {t(link.labelKey)}
          </Link>
        ))}
        <button
          type="button"
          onClick={openPreferences}
          className="inline-flex min-h-8 items-center transition-colors hover:text-foreground"
        >
          {t("consent.manage")}
        </button>
      </nav>
    </div>
  );
}
