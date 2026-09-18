import { useTranslation } from "react-i18next";
import { Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DetailField } from "@/components/detail-field";
import { FormField } from "@/components/form-field";
import { ZoneSelect } from "@/components/zone-select";
import { zoneColor } from "@/lib/colors";
import { ClientTextField, SectionCard } from "./client-fields";
import { ClientTypeIcon } from "./client-type-icon";
import { clientFieldId } from "./client-form";
import type { ClientFormApi } from "./use-client-form";
import { isPharmacyClient, type Client, type ClientType } from "@/features/clients";
import type { Zone } from "@/features/zones";

interface ClientIdentityCardProps {
  mode: "view" | "edit" | "create";
  client: Client | null;
  type: ClientType;
  api?: ClientFormApi;
  zones: Zone[];
  disabled?: boolean;
  className?: string;
}

export function ClientIdentityCard({
  mode,
  client,
  type,
  api,
  zones,
  disabled = false,
  className,
}: ClientIdentityCardProps) {
  const { t } = useTranslation();
  const isPharmacy = type === "PHARMACY";

  const typeBadge = (
    <Badge variant="outline" className="shrink-0 gap-1.5">
      <ClientTypeIcon type={type} className="size-3.5" />
      {t(`clients.types.${type}`)}
    </Badge>
  );

  if (mode === "view" || !api) {
    const zone = client?.zone ?? null;
    return (
      <SectionCard
        title={t("clients.sections.identity")}
        icon={Building2}
        extra={
          <span className="flex flex-wrap items-center justify-end gap-1.5">
            {client?.neverOrdered === true && (
              <Badge variant="outline" className="shrink-0">
                {t("clients.badges.neverOrdered")}
              </Badge>
            )}
            {typeBadge}
          </span>
        }
        className={className}
      >
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <DetailField label={t("clients.fields.name")}>
            {client?.name}
          </DetailField>
          <DetailField
            label={t("clients.fields.code")}
            hint={t("clients.info.codeHint")}
          >
            {client?.code}
          </DetailField>
          <DetailField label={t("clients.fields.zone")}>
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
              t("clients.noZone")
            )}
          </DetailField>
          {client && isPharmacyClient(client) && (
            <DetailField label={t("clients.fields.cip")}>
              <span className="tabular-nums">{client.cip}</span>
            </DetailField>
          )}
        </dl>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title={t("clients.sections.identity")}
      icon={Building2}
      extra={typeBadge}
      className={className}
    >
      <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        {isPharmacy && (
          <ClientTextField
            api={api}
            field="cip"
            label={t("clients.fields.cip")}
            hint={
              mode === "edit"
                ? t("clients.info.cipEditableHint")
                : t("clients.info.cipHint")
            }
            required
            inputMode="numeric"
            disabled={disabled}
            className="tabular-nums"
            fieldClassName="sm:col-span-2"
          />
        )}

        <ClientTextField
          api={api}
          field="name"
          label={t("clients.fields.name")}
          required={!isPharmacy}
          disabled={disabled}
          maxLength={255}
          fieldClassName="sm:col-span-2"
        />

        <ClientTextField
          api={api}
          field="code"
          label={t("clients.fields.code")}
          hint={t("clients.info.codeHint")}
          disabled={disabled}
          maxLength={255}
        />

        <FormField
          label={t("clients.fields.zone")}
          htmlFor={clientFieldId(api.idPrefix, "zoneId")}
          error={api.errors.zoneId}
        >
          <ZoneSelect
            id={clientFieldId(api.idPrefix, "zoneId")}
            value={api.form.zoneId}
            onChange={(next) => api.set("zoneId", next)}
            zones={zones}
            neutralLabel={t("clients.noZone")}
            ariaLabel={t("clients.fields.zone")}
            disabled={disabled}
          />
        </FormField>
      </div>
    </SectionCard>
  );
}
