import { useTranslation } from "react-i18next";
import { Phone } from "lucide-react";
import { DetailField } from "@/components/detail-field";
import {
  PharmacyTextField,
  SectionCard,
} from "@/components/pharmacies/pharmacy-fields";
import type { PharmacyFormApi } from "@/components/pharmacies/use-pharmacy-form";
import type { Pharmacy } from "@/features/pharmacies";

interface PharmacyContactCardProps {
  mode: "view" | "edit" | "create";
  pharmacy: Pharmacy | null;
  api?: PharmacyFormApi;
  disabled?: boolean;
  className?: string;
}

export function PharmacyContactCard({
  mode,
  pharmacy,
  api,
  disabled = false,
  className,
}: PharmacyContactCardProps) {
  const { t } = useTranslation();

  if (mode === "view" || !api) {
    const person = [pharmacy?.quality, pharmacy?.firstName, pharmacy?.lastName]
      .map((part) => part?.trim() ?? "")
      .filter(Boolean)
      .join(" ");
    const empty =
      !person &&
      !pharmacy?.phone?.trim() &&
      !pharmacy?.fax?.trim() &&
      !pharmacy?.email?.trim();

    return (
      <SectionCard
        title={t("pharmacies.sections.contact")}
        icon={Phone}
        className={className}
      >
        {empty ? (
          <p className="text-sm text-muted-foreground">
            {t("pharmacies.info.noContact")}
          </p>
        ) : (
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailField label={t("pharmacies.info.contact")}>{person}</DetailField>
            <DetailField label={t("common.phone")}>
              {pharmacy?.phone?.trim() ? (
                <a href={`tel:${pharmacy.phone}`} className="tabular-nums text-primary underline underline-offset-4">
                  {pharmacy.phone}
                </a>
              ) : null}
            </DetailField>
            <DetailField label={t("pharmacies.info.fax")}>
              <span className="tabular-nums">{pharmacy?.fax}</span>
            </DetailField>
            <DetailField label={t("common.email")}>
              {pharmacy?.email?.trim() ? (
                <a href={`mailto:${pharmacy.email}`} className="break-all text-primary underline underline-offset-4">
                  {pharmacy.email}
                </a>
              ) : null}
            </DetailField>
          </dl>
        )}
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title={t("pharmacies.sections.contact")}
      icon={Phone}
      className={className}
    >
      <div className="flex flex-col">
        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-[7rem_minmax(0,1fr)_minmax(0,1fr)]">
          <PharmacyTextField
            api={api}
            field="quality"
            label={t("pharmacies.info.quality")}
            disabled={disabled}
          />
          <PharmacyTextField
            api={api}
            field="firstName"
            label={t("common.firstName")}
            disabled={disabled}
          />
          <PharmacyTextField
            api={api}
            field="lastName"
            label={t("common.lastName")}
            disabled={disabled}
          />
        </div>
        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <PharmacyTextField
            api={api}
            field="phone"
            label={t("common.phone")}
            type="tel"
            inputMode="tel"
            disabled={disabled}
          />
          <PharmacyTextField
            api={api}
            field="fax"
            label={t("pharmacies.info.fax")}
            type="tel"
            inputMode="tel"
            disabled={disabled}
          />
        </div>
        <PharmacyTextField
          api={api}
          field="email"
          label={t("common.email")}
          type="email"
          inputMode="email"
          disabled={disabled}
        />
      </div>
    </SectionCard>
  );
}
