import { useTranslation } from "react-i18next";
import { Phone } from "lucide-react";
import { DetailField } from "@/components/detail-field";
import { ClientTextField, SectionCard } from "./client-fields";
import type { ClientFormApi } from "./use-client-form";
import type { Client } from "@/features/clients";

interface ClientContactCardProps {
  mode: "view" | "edit" | "create";
  client: Client | null;
  api?: ClientFormApi;
  disabled?: boolean;
  className?: string;
}

export function ClientContactCard({
  mode,
  client,
  api,
  disabled = false,
  className,
}: ClientContactCardProps) {
  const { t } = useTranslation();

  if (mode === "view" || !api) {
    const person = [client?.quality, client?.firstName, client?.lastName]
      .map((part) => part?.trim() ?? "")
      .filter(Boolean)
      .join(" ");
    const empty =
      !person &&
      !client?.phone?.trim() &&
      !client?.fax?.trim() &&
      !client?.email?.trim();

    return (
      <SectionCard
        title={t("clients.sections.contact")}
        icon={Phone}
        className={className}
      >
        {empty ? (
          <p className="text-sm text-muted-foreground">
            {t("clients.info.noContact")}
          </p>
        ) : (
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailField label={t("clients.info.contact")}>{person}</DetailField>
            <DetailField label={t("clients.fields.phone")}>
              {client?.phone?.trim() ? (
                <a
                  href={`tel:${client.phone}`}
                  className="tabular-nums text-primary underline underline-offset-4"
                >
                  {client.phone}
                </a>
              ) : null}
            </DetailField>
            <DetailField label={t("clients.fields.fax")}>
              <span className="tabular-nums">{client?.fax}</span>
            </DetailField>
            <DetailField label={t("clients.fields.email")}>
              {client?.email?.trim() ? (
                <a
                  href={`mailto:${client.email}`}
                  className="break-all text-primary underline underline-offset-4"
                >
                  {client.email}
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
      title={t("clients.sections.contact")}
      icon={Phone}
      className={className}
    >
      <div className="flex flex-col">
        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-[7rem_minmax(0,1fr)_minmax(0,1fr)]">
          <ClientTextField
            api={api}
            field="quality"
            label={t("clients.fields.quality")}
            disabled={disabled}
          />
          <ClientTextField
            api={api}
            field="firstName"
            label={t("clients.fields.firstName")}
            disabled={disabled}
          />
          <ClientTextField
            api={api}
            field="lastName"
            label={t("clients.fields.lastName")}
            disabled={disabled}
          />
        </div>
        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <ClientTextField
            api={api}
            field="phone"
            label={t("clients.fields.phone")}
            type="tel"
            inputMode="tel"
            disabled={disabled}
          />
          <ClientTextField
            api={api}
            field="fax"
            label={t("clients.fields.fax")}
            type="tel"
            inputMode="tel"
            disabled={disabled}
          />
        </div>
        <ClientTextField
          api={api}
          field="email"
          label={t("clients.fields.email")}
          type="email"
          inputMode="email"
          disabled={disabled}
        />
      </div>
    </SectionCard>
  );
}
