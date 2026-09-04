import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Building2,
  Eye,
  EyeOff,
  Infinity as InfinityIcon,
  Lock,
  Mail,
  MailWarning,
  MapPin,
  RectangleHorizontal,
  ScanBarcode,
  Send,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FormField } from "@/components/form-field";
import { SectionCard } from "@/components/section-card";
import { SwitchRow } from "@/components/field-row";
import { DetailField } from "@/components/detail-field";
import { AccountLogoPicker } from "@/components/account/account-logo-picker";
import type {
  AdminAccountFormErrors,
  AdminAccountFormState,
} from "@/components/hyperadmin/admin-account-form";
import type { AdminAccount } from "@/features/admin-accounts";

export interface AdminAccountSectionsProps {
  form: AdminAccountFormState;
  errors: AdminAccountFormErrors;
  set: <K extends keyof AdminAccountFormState>(
    key: K,
    value: AdminAccountFormState[K]
  ) => void;
  disabled: boolean;
  mode: "create" | "edit";
  idPrefix: string;
  account?: AdminAccount;
}

export function AdminAccountSections({
  form,
  errors,
  set,
  disabled,
  mode,
  idPrefix,
  account,
}: AdminAccountSectionsProps) {
  const { t } = useTranslation();
  const [revealPassword, setRevealPassword] = useState(false);
  const id = (name: string) => `${idPrefix}-${name}`;

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <SectionCard
        title={t("hyperadmin.companies.sections.identity")}
        description={t("hyperadmin.companies.sections.identityHint")}
        icon={Building2}
        contentClassName="flex flex-col gap-4"
      >
        <FormField
          label={t("account.company")}
          htmlFor={id("societe")}
          error={errors.societe}
          required
        >
          <Input
            id={id("societe")}
            value={form.societe}
            onChange={(event) => set("societe", event.target.value)}
            disabled={disabled}
            autoComplete="organization"
            className="min-h-11 lg:min-h-10"
          />
        </FormField>

        {mode === "edit" ? (
          <dl>
            <DetailField
              label={t("hyperadmin.companies.code")}
              hint={t("hyperadmin.companies.codeHint")}
            >
              <span className="font-mono tabular-nums">
                {account?.code ?? t("common.notProvided")}
              </span>
            </DetailField>
          </dl>
        ) : (
          <Alert>
            <AlertDescription>
              {t("hyperadmin.companies.codeGenerated")}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-medium">{t("account.logo.label")}</p>
          <AccountLogoPicker
            value={form.logo}
            currentUrl={account?.logoUrl ?? undefined}
            onChange={(draft) => set("logo", draft)}
            disabled={disabled}
          />
          {mode === "create" && (
            <p className="text-xs leading-4 text-muted-foreground">
              {t("hyperadmin.companies.logoAfterCreate")}
            </p>
          )}
        </div>
      </SectionCard>

      <SectionCard
        title={t("hyperadmin.companies.sections.address")}
        description={t("hyperadmin.companies.sections.addressHint")}
        icon={MapPin}
        contentClassName="grid grid-cols-1 gap-x-4 sm:grid-cols-2"
      >
        <FormField
          label={t("common.address")}
          htmlFor={id("address1")}
          error={errors.address1}
          required={mode === "create"}
          className="sm:col-span-2"
        >
          <Input
            id={id("address1")}
            value={form.address1}
            onChange={(event) => set("address1", event.target.value)}
            disabled={disabled}
            autoComplete="address-line1"
            className="min-h-11 lg:min-h-10"
          />
        </FormField>
        <FormField
          label={t("account.companyTab.address2")}
          htmlFor={id("address2")}
          error={errors.address2}
          className="sm:col-span-2"
        >
          <Input
            id={id("address2")}
            value={form.address2}
            onChange={(event) => set("address2", event.target.value)}
            disabled={disabled}
            autoComplete="address-line2"
            className="min-h-11 lg:min-h-10"
          />
        </FormField>
        <FormField
          label={t("common.postalCode")}
          htmlFor={id("postalCode")}
          error={errors.postalCode}
        >
          <Input
            id={id("postalCode")}
            value={form.postalCode}
            onChange={(event) => set("postalCode", event.target.value)}
            disabled={disabled}
            autoComplete="postal-code"
            className="min-h-11 lg:min-h-10"
          />
        </FormField>
        <FormField
          label={t("common.city")}
          htmlFor={id("city")}
          error={errors.city}
        >
          <Input
            id={id("city")}
            value={form.city}
            onChange={(event) => set("city", event.target.value)}
            disabled={disabled}
            autoComplete="address-level2"
            className="min-h-11 lg:min-h-10"
          />
        </FormField>
        <FormField
          label={t("account.companyTab.country")}
          htmlFor={id("country")}
          error={errors.country}
          className="sm:col-span-2"
        >
          <Input
            id={id("country")}
            value={form.country}
            onChange={(event) => set("country", event.target.value)}
            disabled={disabled}
            autoComplete="country-name"
            className="min-h-11 lg:min-h-10"
          />
        </FormField>
        <FormField
          label={t("hyperadmin.companies.latitude")}
          htmlFor={id("latitude")}
          error={errors.latitude}
          hint={t("hyperadmin.companies.depotHint")}
        >
          <Input
            id={id("latitude")}
            inputMode="decimal"
            value={form.latitude}
            onChange={(event) => set("latitude", event.target.value)}
            disabled={disabled}
            autoComplete="off"
            className="min-h-11 lg:min-h-10"
          />
        </FormField>
        <FormField
          label={t("hyperadmin.companies.longitude")}
          htmlFor={id("longitude")}
          error={errors.longitude}
        >
          <Input
            id={id("longitude")}
            inputMode="decimal"
            value={form.longitude}
            onChange={(event) => set("longitude", event.target.value)}
            disabled={disabled}
            autoComplete="off"
            className="min-h-11 lg:min-h-10"
          />
        </FormField>
      </SectionCard>

      <SectionCard
        title={t("hyperadmin.companies.sections.quota")}
        description={t("hyperadmin.companies.sections.quotaHint")}
        icon={Users}
        contentClassName="flex flex-col gap-3"
      >
        <SwitchRow
          id={id("maxProfilesUnlimited")}
          icon={InfinityIcon}
          label={t("hyperadmin.companies.quotaUnlimitedLabel")}
          summary={t("hyperadmin.companies.quotaUnlimitedHint")}
          checked={form.maxProfilesUnlimited}
          onCheckedChange={(checked) => set("maxProfilesUnlimited", checked)}
          disabled={disabled}
        />
        {!form.maxProfilesUnlimited && (
          <FormField
            label={t("hyperadmin.companies.maxProfiles")}
            htmlFor={id("maxProfiles")}
            error={errors.maxProfiles}
            hint={t("hyperadmin.companies.maxProfilesHint")}
          >
            <Input
              id={id("maxProfiles")}
              inputMode="numeric"
              value={form.maxProfiles}
              onChange={(event) => set("maxProfiles", event.target.value)}
              disabled={disabled}
              autoComplete="off"
              className="min-h-11 w-32 lg:min-h-10"
            />
          </FormField>
        )}
      </SectionCard>

      <SectionCard
        title={t("account.smtp.title")}
        description={t("account.smtp.subtitle")}
        icon={Mail}
        contentClassName="flex flex-col gap-3"
      >
        <SwitchRow
          id={id("smtpEnable")}
          icon={Mail}
          label={t("account.smtp.enable")}
          summary={t("account.smtp.enableHint")}
          checked={form.smtpEnable}
          onCheckedChange={(checked) => set("smtpEnable", checked)}
          disabled={disabled}
        />
        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <FormField
            label={t("account.smtp.host")}
            htmlFor={id("smtpHost")}
            error={errors.smtpHost}
            required={form.smtpEnable}
          >
            <Input
              id={id("smtpHost")}
              value={form.smtpHost}
              onChange={(event) => set("smtpHost", event.target.value)}
              disabled={disabled}
              autoComplete="off"
              className="min-h-11 lg:min-h-10"
            />
          </FormField>
          <FormField
            label={t("account.smtp.port")}
            htmlFor={id("smtpPort")}
            error={errors.smtpPort}
            required={form.smtpEnable}
          >
            <Input
              id={id("smtpPort")}
              inputMode="numeric"
              value={form.smtpPort}
              onChange={(event) => set("smtpPort", event.target.value)}
              disabled={disabled}
              autoComplete="off"
              className="min-h-11 lg:min-h-10"
            />
          </FormField>
          <FormField
            label={t("account.smtp.username")}
            htmlFor={id("smtpUsername")}
            error={errors.smtpUsername}
          >
            <Input
              id={id("smtpUsername")}
              value={form.smtpUsername}
              onChange={(event) => set("smtpUsername", event.target.value)}
              disabled={disabled}
              autoComplete="off"
              className="min-h-11 lg:min-h-10"
            />
          </FormField>
          <FormField
            label={t("account.smtp.password")}
            htmlFor={id("smtpPassword")}
            error={errors.smtpPassword}
          >
            <div className="flex items-center gap-2">
              <Input
                id={id("smtpPassword")}
                type={revealPassword ? "text" : "password"}
                value={form.smtpPassword}
                onChange={(event) => set("smtpPassword", event.target.value)}
                disabled={disabled}
                autoComplete="new-password"
                className="min-h-11 lg:min-h-10"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-11 shrink-0 lg:size-10"
                aria-label={
                  revealPassword
                    ? t("account.smtp.hidePassword")
                    : t("account.smtp.showPassword")
                }
                onClick={() => setRevealPassword((previous) => !previous)}
              >
                {revealPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </Button>
            </div>
          </FormField>
        </div>
        <SwitchRow
          id={id("smtpUseTls")}
          icon={ShieldCheck}
          label={t("account.smtp.useTls")}
          checked={form.smtpUseTls}
          onCheckedChange={(checked) => set("smtpUseTls", checked)}
          disabled={disabled}
        />
        <SwitchRow
          id={id("smtpUseSsl")}
          icon={Lock}
          label={t("account.smtp.useSsl")}
          checked={form.smtpUseSsl}
          onCheckedChange={(checked) => set("smtpUseSsl", checked)}
          disabled={disabled}
        />
        {errors.smtpUseTls && (
          <p role="alert" className="text-xs leading-4 text-destructive">
            {errors.smtpUseTls}
          </p>
        )}
      </SectionCard>

      <SectionCard
        title={t("hyperadmin.companies.sections.sender")}
        description={t("hyperadmin.companies.sections.senderHint")}
        icon={Send}
        contentClassName="flex flex-col gap-3"
      >
        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <FormField
            label={t("account.labels.senderName")}
            htmlFor={id("senderName")}
            error={errors.senderName}
            className="sm:col-span-2"
          >
            <Input
              id={id("senderName")}
              value={form.senderName}
              onChange={(event) => set("senderName", event.target.value)}
              disabled={disabled}
              autoComplete="off"
              className="min-h-11 lg:min-h-10"
            />
          </FormField>
          <FormField
            label={t("account.labels.senderAddress")}
            htmlFor={id("senderAddress")}
            error={errors.senderAddress}
            className="sm:col-span-2"
          >
            <Input
              id={id("senderAddress")}
              value={form.senderAddress}
              onChange={(event) => set("senderAddress", event.target.value)}
              disabled={disabled}
              autoComplete="off"
              className="min-h-11 lg:min-h-10"
            />
          </FormField>
          <FormField
            label={t("common.postalCode")}
            htmlFor={id("senderPostalCode")}
            error={errors.senderPostalCode}
          >
            <Input
              id={id("senderPostalCode")}
              value={form.senderPostalCode}
              onChange={(event) => set("senderPostalCode", event.target.value)}
              disabled={disabled}
              autoComplete="off"
              className="min-h-11 lg:min-h-10"
            />
          </FormField>
          <FormField
            label={t("common.city")}
            htmlFor={id("senderCity")}
            error={errors.senderCity}
          >
            <Input
              id={id("senderCity")}
              value={form.senderCity}
              onChange={(event) => set("senderCity", event.target.value)}
              disabled={disabled}
              autoComplete="off"
              className="min-h-11 lg:min-h-10"
            />
          </FormField>
          <FormField
            label={t("account.companyTab.country")}
            htmlFor={id("senderCountry")}
            error={errors.senderCountry}
            className="sm:col-span-2"
          >
            <Input
              id={id("senderCountry")}
              value={form.senderCountry}
              onChange={(event) => set("senderCountry", event.target.value)}
              disabled={disabled}
              autoComplete="off"
              className="min-h-11 lg:min-h-10"
            />
          </FormField>
        </div>
        <SwitchRow
          id={id("isLabelLandscape")}
          icon={RectangleHorizontal}
          label={t("hyperadmin.companies.labelLandscape")}
          summary={t("hyperadmin.companies.labelLandscapeHint")}
          checked={form.isLabelLandscape}
          onCheckedChange={(checked) => set("isLabelLandscape", checked)}
          disabled={disabled}
        />
      </SectionCard>

      <SectionCard
        title={t("hyperadmin.companies.sections.operations")}
        description={t("hyperadmin.companies.sections.operationsHint")}
        icon={ScanBarcode}
        contentClassName="flex flex-col gap-3"
      >
        <SwitchRow
          id={id("isScanCIP")}
          icon={ScanBarcode}
          label={t("account.options.scanCip")}
          summary={t("account.options.scanCipHint")}
          checked={form.isScanCIP}
          onCheckedChange={(checked) => set("isScanCIP", checked)}
          disabled={disabled}
        />
        <SwitchRow
          id={id("autoSendAnomalieEmails")}
          icon={MailWarning}
          label={t("account.emails.autoSend")}
          summary={t("account.emails.autoSendHint")}
          checked={form.autoSendAnomalieEmails}
          onCheckedChange={(checked) => set("autoSendAnomalieEmails", checked)}
          disabled={disabled}
        />
        <FormField
          label={t("hyperadmin.companies.anomaliesEmails")}
          htmlFor={id("anomaliesEmails")}
          error={errors.anomaliesEmails}
          hint={t("hyperadmin.companies.anomaliesEmailsHint")}
        >
          <Input
            id={id("anomaliesEmails")}
            value={form.anomaliesEmails}
            onChange={(event) => set("anomaliesEmails", event.target.value)}
            disabled={disabled}
            autoComplete="off"
            className="min-h-11 lg:min-h-10"
          />
        </FormField>
        <FormField
          label={t("account.options.defaultTourDeparture")}
          htmlFor={id("defaultTourDepartureTime")}
          error={errors.defaultTourDepartureTime}
          hint={t("hyperadmin.companies.departureHint")}
        >
          <Input
            id={id("defaultTourDepartureTime")}
            type="time"
            value={form.defaultTourDepartureTime}
            onChange={(event) =>
              set("defaultTourDepartureTime", event.target.value)
            }
            disabled={disabled}
            className="min-h-11 w-fit lg:min-h-10"
          />
        </FormField>
      </SectionCard>
    </div>
  );
}
