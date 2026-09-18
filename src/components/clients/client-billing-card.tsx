import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronRight, ReceiptText, TriangleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DetailField } from "@/components/detail-field";
import { addressLines } from "@/lib/address-form";
import { ClientBillingField, ClientTextField, SectionCard } from "./client-fields";
import { hasBillingAddress } from "./client-form";
import type { ClientFormApi } from "./use-client-form";
import type { Client } from "@/features/clients";

interface ClientBillingCardProps {
  mode: "view" | "edit" | "create";
  client: Client | null;
  api?: ClientFormApi;
  disabled?: boolean;
  className?: string;
}

export function ClientBillingCard({
  mode,
  client,
  api,
  disabled = false,
  className,
}: ClientBillingCardProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(() =>
    api ? hasBillingAddress(api.form.billingAddress) : false
  );

  const billingErrors = api
    ? Object.keys(api.errors).some((key) => key.startsWith("billingAddress."))
    : false;

  useEffect(() => {
    if (billingErrors) setOpen(true);
  }, [billingErrors]);

  const missing = client?.missingFields ?? [];

  if (mode === "view" || !api) {
    const billing = client?.billingAddress ?? null;
    const billingLines = billing ? addressLines(billing) : [];
    return (
      <SectionCard
        title={t("clients.sections.billing")}
        description={t("clients.sections.billingDesc")}
        icon={ReceiptText}
        className={className}
        contentClassName="flex flex-col gap-4"
      >
        {missing.length > 0 && (
          <Alert variant="warning">
            <TriangleAlert />
            <AlertTitle>{t("clients.missingTitle")}</AlertTitle>
            <AlertDescription>
              {missing
                .map((field) =>
                  t(`clients.fields.${field}`, { defaultValue: field })
                )
                .join(", ")}
            </AlertDescription>
          </Alert>
        )}
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DetailField label={t("clients.fields.siret")}>
            <span className="tabular-nums">{client?.siret}</span>
          </DetailField>
          <DetailField label={t("clients.fields.vatNumber")}>
            {client?.vatNumber}
          </DetailField>
          <DetailField
            label={t("clients.form.billingAddress")}
            className="sm:col-span-2"
          >
            {billing ? (
              <span className="block">
                {billing.name && <span className="block">{billing.name}</span>}
                {billingLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
                {billing.email && (
                  <span className="block break-all">{billing.email}</span>
                )}
              </span>
            ) : (
              <span className="text-muted-foreground">
                {t("clients.info.billingSameAddress")}
              </span>
            )}
          </DetailField>
        </dl>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title={t("clients.sections.billing")}
      description={t("clients.sections.billingDesc")}
      icon={ReceiptText}
      className={className}
      contentClassName="flex flex-col"
    >
      <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        <ClientTextField
          api={api}
          field="siret"
          label={t("clients.fields.siret")}
          inputMode="numeric"
          disabled={disabled}
          className="tabular-nums"
        />
        <ClientTextField
          api={api}
          field="vatNumber"
          label={t("clients.fields.vatNumber")}
          disabled={disabled}
        />
      </div>

      <div className="rounded-lg border border-border">
        <button
          type="button"
          onClick={() => setOpen((previous) => !previous)}
          aria-expanded={open}
          aria-controls={`${api.idPrefix}-billing-address`}
          className="flex min-h-12 w-full items-center gap-2 px-3 text-left text-sm font-medium"
        >
          {open ? (
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          )}
          <span className="min-w-0 flex-1">
            {t("clients.form.billingAddress")}
          </span>
          {hasBillingAddress(api.form.billingAddress) && (
            <span className="shrink-0 text-xs font-normal text-muted-foreground">
              {t("clients.form.billingAddressFilled")}
            </span>
          )}
        </button>
        {open && (
          <div
            id={`${api.idPrefix}-billing-address`}
            className="border-t border-border px-3 pb-1 pt-3"
          >
            <p className="mb-2 text-xs text-muted-foreground">
              {t("clients.form.billingAddressHint")}
            </p>
            <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
              <ClientBillingField
                api={api}
                field="name"
                label={t("clients.fields.name")}
                disabled={disabled}
                fieldClassName="sm:col-span-2"
              />
              <ClientBillingField
                api={api}
                field="address1"
                label={t("clients.fields.address1")}
                disabled={disabled}
                fieldClassName="sm:col-span-2"
              />
              <ClientBillingField
                api={api}
                field="address2"
                label={t("clients.fields.address2")}
                disabled={disabled}
                fieldClassName="sm:col-span-2"
              />
              <ClientBillingField
                api={api}
                field="postalCode"
                label={t("clients.fields.postalCode")}
                inputMode="numeric"
                disabled={disabled}
                className="tabular-nums"
              />
              <ClientBillingField
                api={api}
                field="city"
                label={t("clients.fields.city")}
                disabled={disabled}
              />
              <ClientBillingField
                api={api}
                field="country"
                label={t("clients.fields.country")}
                disabled={disabled}
              />
              <ClientBillingField
                api={api}
                field="email"
                label={t("clients.fields.email")}
                type="email"
                disabled={disabled}
              />
            </div>
          </div>
        )}
      </div>
      <p className="mt-2 min-h-4 text-xs leading-4 text-muted-foreground">
        {t("clients.info.billingHint")}
      </p>
    </SectionCard>
  );
}
