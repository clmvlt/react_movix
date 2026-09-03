import { useTranslation } from "react-i18next";
import { Building2, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DetailField } from "@/components/detail-field";
import { FormField } from "@/components/form-field";
import { ZoneSelect } from "@/components/pharmacies/zone-select";
import {
  PharmacyTextField,
  SectionCard,
} from "@/components/pharmacies/pharmacy-fields";
import { pharmacyFieldId } from "@/components/pharmacies/pharmacy-form";
import type { PharmacyFormApi } from "@/components/pharmacies/use-pharmacy-form";
import { zoneColor } from "@/lib/colors";
import type { Pharmacy } from "@/features/pharmacies";
import type { Zone } from "@/features/zones";

export type CipStatus = "idle" | "checking" | "available" | "exists";

export interface CipControl {
  status: CipStatus;
  locked: boolean;
  loading: boolean;
  onBlur: () => void;
  onLoadReference: () => void;
}

interface PharmacyIdentityCardProps {
  mode: "view" | "edit" | "create";
  pharmacy: Pharmacy | null;
  api?: PharmacyFormApi;
  zones: Zone[];
  disabled?: boolean;
  cip?: CipControl;
  className?: string;
}

export function PharmacyIdentityCard({
  mode,
  pharmacy,
  api,
  zones,
  disabled = false,
  cip,
  className,
}: PharmacyIdentityCardProps) {
  const { t } = useTranslation();

  const neverOrdered = pharmacy?.neverOrdered === true && (
    <Badge variant="outline" className="shrink-0">
      {t("pharmacies.badges.neverOrdered")}
    </Badge>
  );

  if (mode === "view" || !api) {
    const zone = pharmacy?.zone ?? null;
    return (
      <SectionCard
        title={t("pharmacies.sections.identity")}
        icon={Building2}
        extra={neverOrdered || undefined}
        className={className}
      >
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <DetailField label={t("common.name")}>{pharmacy?.name}</DetailField>
          <DetailField label={t("pharmacies.info.zone")}>
            {zone ? (
              <span className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: zoneColor(zone.id) }}
                />
                <span className="truncate">{zone.name}</span>
              </span>
            ) : (
              t("pharmacies.info.noZone")
            )}
          </DetailField>
          <DetailField label={t("pharmacies.form.cip")}>
            <span className="tabular-nums">{pharmacy?.cip}</span>
          </DetailField>
        </dl>
      </SectionCard>
    );
  }

  const cipId = pharmacyFieldId(api.idPrefix, "cip");
  const cipHint =
    cip?.status === "checking"
      ? t("pharmacies.form.cipChecking")
      : cip?.status === "available"
        ? t("pharmacies.form.cipAvailable")
        : cip?.locked
          ? undefined
          : t("pharmacies.form.cipHint");

  return (
    <SectionCard
      title={t("pharmacies.sections.identity")}
      icon={Building2}
      extra={neverOrdered || undefined}
      className={className}
    >
      <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        {mode === "create" && (
          <PharmacyTextField
            api={api}
            field="cip"
            label={t("pharmacies.form.cip")}
            hint={cipHint}
            required
            inputMode="numeric"
            disabled={disabled || cip?.locked || cip?.loading}
            onBlur={cip?.onBlur}
            className="tabular-nums"
            fieldClassName="sm:col-span-2"
          />
        )}

        <PharmacyTextField
          api={api}
          field="name"
          label={t("common.name")}
          required
          disabled={disabled}
          fieldClassName="sm:col-span-2"
        />

        <FormField
          label={t("pharmacies.info.zone")}
          htmlFor={pharmacyFieldId(api.idPrefix, "zoneId")}
          error={api.errors.zoneId}
        >
          <ZoneSelect
            id={pharmacyFieldId(api.idPrefix, "zoneId")}
            value={api.form.zoneId}
            onChange={(next) => api.set("zoneId", next)}
            zones={zones}
            neutralLabel={t("pharmacies.info.noZone")}
            ariaLabel={t("pharmacies.info.zone")}
            disabled={disabled}
          />
        </FormField>

        {mode === "edit" && (
          <FormField
            label={t("pharmacies.form.cip")}
            htmlFor={cipId}
            hint={t("pharmacies.info.cipReadonlyHint")}
          >
            <Input
              id={cipId}
              value={api.form.cip}
              readOnly
              disabled
              className="min-h-11 tabular-nums lg:min-h-10"
            />
          </FormField>
        )}
      </div>

      {mode === "create" && cip?.status === "exists" && !cip.locked && (
        <Alert className="mt-2">
          <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{t("pharmacies.form.cipExists")}</span>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 shrink-0 lg:min-h-9"
              onClick={cip.onLoadReference}
              disabled={cip.loading || disabled}
            >
              {cip.loading && <Loader2 className="animate-spin" />}
              {t("pharmacies.form.attachAction")}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {mode === "create" && cip?.locked && (
        <Alert variant="success" className="mt-2">
          <AlertDescription>{t("pharmacies.form.attachLoaded")}</AlertDescription>
        </Alert>
      )}
    </SectionCard>
  );
}
