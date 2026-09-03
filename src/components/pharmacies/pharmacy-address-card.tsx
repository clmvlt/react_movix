import { useTranslation } from "react-i18next";
import { MapPin } from "lucide-react";
import { FormField } from "@/components/form-field";
import { NotProvided } from "@/components/not-provided";
import { AddressSearch } from "@/components/address-search";
import {
  PharmacyTextField,
  SectionCard,
} from "@/components/pharmacies/pharmacy-fields";
import {
  addressSummary,
  pharmacyFieldId,
} from "@/components/pharmacies/pharmacy-form";
import { addressLines } from "@/components/pharmacies/pharmacy-utils";
import type { PharmacyFormApi } from "@/components/pharmacies/use-pharmacy-form";
import type { Pharmacy } from "@/features/pharmacies";
import type { LngLat } from "@/components/map";

interface PharmacyAddressCardProps {
  mode: "view" | "edit" | "create";
  pharmacy: Pharmacy | null;
  api?: PharmacyFormApi;
  depot: LngLat | null;
  disabled?: boolean;
  autoFocusSearch?: boolean;
  className?: string;
}

export function PharmacyAddressCard({
  mode,
  pharmacy,
  api,
  depot,
  disabled = false,
  autoFocusSearch = false,
  className,
}: PharmacyAddressCardProps) {
  const { t } = useTranslation();

  if (mode === "view" || !api) {
    const lines = pharmacy ? addressLines(pharmacy) : [];
    return (
      <SectionCard
        title={t("pharmacies.sections.address")}
        icon={MapPin}
        className={className}
      >
        {lines.length > 0 ? (
          <p className="text-sm text-foreground">
            {lines.map((line, index) => (
              <span key={index} className="block">
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

  const searchId = pharmacyFieldId(api.idPrefix, "address-search");

  return (
    <SectionCard
      title={t("pharmacies.sections.address")}
      icon={MapPin}
      className={className}
    >
      <div className="flex flex-col">
        <FormField
          label={t("pharmacies.info.findAddress")}
          htmlFor={searchId}
          hint={t("pharmacies.info.findAddressHint")}
        >
          <AddressSearch
            id={searchId}
            onSelect={api.applyAddress}
            near={api.position ?? depot}
            defaultTerm={addressSummary(api.form)}
            autoFocus={autoFocusSearch}
            ariaLabel={t("pharmacies.info.findAddress")}
            inputClassName="shadow-sm"
            listClassName="max-h-64 lg:max-h-72"
          />
        </FormField>

        <PharmacyTextField
          api={api}
          field="address1"
          label={t("common.address")}
          disabled={disabled}
        />

        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <PharmacyTextField
            api={api}
            field="address2"
            label={t("pharmacies.info.address2")}
            disabled={disabled}
          />
          <PharmacyTextField
            api={api}
            field="address3"
            label={t("pharmacies.info.address3")}
            disabled={disabled}
          />
        </div>

        <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-x-4 sm:grid-cols-[7rem_minmax(0,1fr)_minmax(0,1fr)]">
          <PharmacyTextField
            api={api}
            field="postalCode"
            label={t("common.postalCode")}
            inputMode="numeric"
            disabled={disabled}
            className="tabular-nums"
          />
          <PharmacyTextField
            api={api}
            field="city"
            label={t("common.city")}
            disabled={disabled}
          />
          <PharmacyTextField
            api={api}
            field="country"
            label={t("pharmacies.info.country")}
            disabled={disabled}
            fieldClassName="col-span-2 sm:col-span-1"
          />
        </div>

        <p className="text-xs leading-4 text-muted-foreground">
          {t("pharmacies.info.accountScope")}
        </p>
      </div>
    </SectionCard>
  );
}
