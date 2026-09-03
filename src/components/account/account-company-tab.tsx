import { Suspense, lazy } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/form-field";
import { DetailField } from "@/components/detail-field";
import { InlineSpinner } from "@/components/full-page-spinner";
import { imageUrl } from "@/lib/images";
import { useAuth } from "@/app/auth-context";
import { AccountCodeCard } from "./account-code-card";
import { AccountLogoPicker } from "./account-logo-picker";
import type { AccountTabProps } from "./account-form";

const DepotMap = lazy(() =>
  import("./account-depot-map").then((module) => ({
    default: module.AccountDepotMap,
  }))
);

type CompanyTabProps =
  | ({ readOnly?: false } & AccountTabProps)
  | { readOnly: true };

export function AccountCompanyTab(props: CompanyTabProps) {
  const { t } = useTranslation();

  if (props.readOnly) return <CompanyReadOnly />;

  const { form, baseline, errors, set, disabled } = props;

  return (
    <div className="grid auto-rows-min grid-cols-1 gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t("account.companyTab.title")}
          </CardTitle>
          <CardDescription>{t("account.companyTab.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <FormField
              label={t("account.company")}
              htmlFor="societe"
              error={errors.societe}
              required
              className="sm:col-span-2"
            >
              <Input
                id="societe"
                value={form.societe}
                onChange={(e) => set("societe", e.target.value)}
                disabled={disabled}
                autoComplete="organization"
              />
            </FormField>
            <FormField
              label={t("common.address")}
              htmlFor="address1"
              error={errors.address1}
              className="sm:col-span-2"
            >
              <Input
                id="address1"
                value={form.address1}
                onChange={(e) => set("address1", e.target.value)}
                disabled={disabled}
                autoComplete="address-line1"
              />
            </FormField>
            <FormField
              label={t("account.companyTab.address2")}
              htmlFor="address2"
              error={errors.address2}
              className="sm:col-span-2"
            >
              <Input
                id="address2"
                value={form.address2}
                onChange={(e) => set("address2", e.target.value)}
                disabled={disabled}
                autoComplete="address-line2"
              />
            </FormField>
            <FormField
              label={t("common.postalCode")}
              htmlFor="postalCode"
              error={errors.postalCode}
            >
              <Input
                id="postalCode"
                value={form.postalCode}
                onChange={(e) => set("postalCode", e.target.value)}
                disabled={disabled}
                autoComplete="postal-code"
              />
            </FormField>
            <FormField
              label={t("common.city")}
              htmlFor="city"
              error={errors.city}
            >
              <Input
                id="city"
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                disabled={disabled}
                autoComplete="address-level2"
              />
            </FormField>
            <FormField
              label={t("account.companyTab.country")}
              htmlFor="country"
              error={errors.country}
            >
              <Input
                id="country"
                value={form.country}
                onChange={(e) => set("country", e.target.value)}
                disabled={disabled}
                autoComplete="country-name"
              />
            </FormField>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        <AccountCodeCard />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("account.logo.label")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AccountLogoPicker
              value={form.logo}
              currentUrl={baseline.logoUrl}
              onChange={(draft) => set("logo", draft)}
              disabled={disabled}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CompanyReadOnly() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const account = user?.account;
  const logo = imageUrl(account?.logoUrl);

  const located = account?.latitude != null && account?.longitude != null;

  return (
    <div className="grid auto-rows-min grid-cols-1 gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t("account.companyTab.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {logo && (
            <img
              src={logo}
              alt={t("account.logo.preview")}
              className="size-24 rounded-lg border border-border object-contain"
            />
          )}
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailField label={t("account.company")}>
              {account?.societe}
            </DetailField>
            <DetailField label={t("common.address")}>
              {[account?.address1, account?.address2].filter(Boolean).join(", ")}
            </DetailField>
            <DetailField label={t("common.postalCode")}>
              {account?.postalCode}
            </DetailField>
            <DetailField label={t("common.city")}>{account?.city}</DetailField>
            <DetailField label={t("account.companyTab.country")}>
              {account?.country}
            </DetailField>
          </dl>

          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground">
              {t("account.depot.coordinates")}
            </p>
            <div className="h-56 overflow-hidden rounded-xl border border-border sm:h-64">
              {located ? (
                <Suspense fallback={<InlineSpinner />}>
                  <DepotMap
                    longitude={account.longitude as number}
                    latitude={account.latitude as number}
                    title={account.societe ?? t("account.depot.title")}
                    draggable={false}
                  />
                </Suspense>
              ) : (
                <div className="flex size-full items-center justify-center p-4 text-center text-sm text-muted-foreground">
                  {t("account.depot.missing")}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <AccountCodeCard />
    </div>
  );
}
