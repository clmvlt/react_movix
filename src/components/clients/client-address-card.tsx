import { useTranslation } from "react-i18next";
import { MapPin } from "lucide-react";
import { FormField } from "@/components/form-field";
import { NotProvided } from "@/components/not-provided";
import { AddressSearch } from "@/components/address-search";
import { addressLines, addressSummary } from "@/lib/address-form";
import { ClientTextField, SectionCard } from "./client-fields";
import { clientFieldId } from "./client-form";
import type { ClientFormApi } from "./use-client-form";
import type { Client } from "@/features/clients";
import type { LngLat } from "@/components/map";

interface ClientAddressCardProps {
  mode: "view" | "edit" | "create";
  client: Client | null;
  api?: ClientFormApi;
  depot: LngLat | null;
  disabled?: boolean;
  autoFocusSearch?: boolean;
  className?: string;
}

export function ClientAddressCard({
  mode,
  client,
  api,
  depot,
  disabled = false,
  autoFocusSearch = false,
  className,
}: ClientAddressCardProps) {
  const { t } = useTranslation();

  if (mode === "view" || !api) {
    const lines = client ? addressLines(client) : [];
    return (
      <SectionCard
        title={t("clients.sections.address")}
        icon={MapPin}
        className={className}
      >
        {lines.length > 0 ? (
          <p className="text-sm text-foreground">
            {lines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </p>
        ) : (
          <p className="text-sm">
            <NotProvided />
          </p>
        )}
      </SectionCard>
    );
  }

  const searchId = clientFieldId(api.idPrefix, "address-search");

  return (
    <SectionCard
      title={t("clients.sections.address")}
      icon={MapPin}
      className={className}
    >
      <div className="flex flex-col">
        <FormField
          label={t("clients.info.findAddress")}
          htmlFor={searchId}
          hint={t("clients.info.findAddressHint")}
        >
          <AddressSearch
            id={searchId}
            onSelect={api.applyAddress}
            near={api.position ?? depot}
            defaultTerm={addressSummary(api.form)}
            autoFocus={autoFocusSearch}
            ariaLabel={t("clients.info.findAddress")}
            inputClassName="shadow-sm"
            listClassName="max-h-64 lg:max-h-72"
          />
        </FormField>

        <ClientTextField
          api={api}
          field="address1"
          label={t("clients.fields.address1")}
          disabled={disabled}
        />

        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <ClientTextField
            api={api}
            field="address2"
            label={t("clients.fields.address2")}
            disabled={disabled}
          />
          <ClientTextField
            api={api}
            field="address3"
            label={t("clients.fields.address3")}
            disabled={disabled}
          />
        </div>

        <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-x-4 sm:grid-cols-[7rem_minmax(0,1fr)_minmax(0,1fr)]">
          <ClientTextField
            api={api}
            field="postalCode"
            label={t("clients.fields.postalCode")}
            inputMode="numeric"
            disabled={disabled}
            className="tabular-nums"
          />
          <ClientTextField
            api={api}
            field="city"
            label={t("clients.fields.city")}
            disabled={disabled}
          />
          <ClientTextField
            api={api}
            field="country"
            label={t("clients.fields.country")}
            placeholder={t("clients.countryPlaceholder")}
            disabled={disabled}
            fieldClassName="col-span-2 sm:col-span-1"
          />
        </div>
      </div>
    </SectionCard>
  );
}
