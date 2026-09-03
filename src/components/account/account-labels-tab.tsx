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
import type { AccountTabProps } from "./account-form";

export function AccountLabelsTab({
  form,
  errors,
  set,
  disabled,
}: AccountTabProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("account.labels.title")}</CardTitle>
        <CardDescription>{t("account.labels.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2 xl:grid-cols-3">
          <FormField
            label={t("account.labels.senderName")}
            htmlFor="senderName"
            error={errors.senderName}
            className="sm:col-span-2 xl:col-span-3"
          >
            <Input
              id="senderName"
              value={form.senderName}
              onChange={(e) => set("senderName", e.target.value)}
              disabled={disabled}
            />
          </FormField>
          <FormField
            label={t("account.labels.senderAddress")}
            htmlFor="senderAddress"
            error={errors.senderAddress}
            className="sm:col-span-2 xl:col-span-3"
          >
            <Input
              id="senderAddress"
              value={form.senderAddress}
              onChange={(e) => set("senderAddress", e.target.value)}
              disabled={disabled}
            />
          </FormField>
          <FormField
            label={t("common.postalCode")}
            htmlFor="senderPostalCode"
            error={errors.senderPostalCode}
          >
            <Input
              id="senderPostalCode"
              value={form.senderPostalCode}
              onChange={(e) => set("senderPostalCode", e.target.value)}
              disabled={disabled}
            />
          </FormField>
          <FormField
            label={t("common.city")}
            htmlFor="senderCity"
            error={errors.senderCity}
          >
            <Input
              id="senderCity"
              value={form.senderCity}
              onChange={(e) => set("senderCity", e.target.value)}
              disabled={disabled}
            />
          </FormField>
          <FormField
            label={t("account.companyTab.country")}
            htmlFor="senderCountry"
            error={errors.senderCountry}
          >
            <Input
              id="senderCountry"
              value={form.senderCountry}
              onChange={(e) => set("senderCountry", e.target.value)}
              disabled={disabled}
            />
          </FormField>
        </div>
      </CardContent>
    </Card>
  );
}
