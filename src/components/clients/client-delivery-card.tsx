import { useTranslation } from "react-i18next";
import { Building2, Check, Clock, KeyRound, Minus, Truck } from "lucide-react";
import { DetailField } from "@/components/detail-field";
import { FormField } from "@/components/form-field";
import { FieldRow, SwitchRow } from "@/components/field-row";
import { DeliveryWindowFields } from "@/components/delivery-window-fields";
import { KeyColorInput } from "@/components/key-color-input";
import { KeyTag } from "@/components/key-tag";
import { ClientTextArea, ClientTextField, SectionCard } from "./client-fields";
import { clientFieldId } from "./client-form";
import type { ClientFormApi } from "./use-client-form";
import { isPharmacyClient, type Client, type ClientType } from "@/features/clients";

interface ClientDeliveryCardProps {
  mode: "view" | "edit" | "create";
  client: Client | null;
  type: ClientType;
  api?: ClientFormApi;
  disabled?: boolean;
  className?: string;
}

type Translate = (key: string, options?: Record<string, unknown>) => string;

function ReadOnlyFlag({ checked }: { checked: boolean }) {
  const { t } = useTranslation();
  return checked ? (
    <span className="flex size-9 shrink-0 items-center justify-center text-primary">
      <Check aria-hidden className="size-5" />
      <span className="sr-only">{t("common.yes")}</span>
    </span>
  ) : (
    <span className="flex size-9 shrink-0 items-center justify-center text-muted-foreground">
      <Minus aria-hidden className="size-5" />
      <span className="sr-only">{t("common.no")}</span>
    </span>
  );
}

function windowSummary(
  start: string | null | undefined,
  end: string | null | undefined,
  t: Translate
): string {
  if (start && end) return t("deliveryWindow.summaryRange", { start, end });
  if (start) return t("deliveryWindow.summaryFrom", { start });
  if (end) return t("deliveryWindow.summaryUntil", { end });
  return t("deliveryWindow.none");
}

function keySummary(
  numero: string | null | undefined,
  color: string | null | undefined,
  t: Translate
): string {
  const number = numero?.trim();
  if (number) return t("clients.info.keySummary", { numero: number });
  if (color?.trim()) return t("clients.info.keyColorOnly");
  return t("clients.info.keyNone");
}

export function ClientDeliveryCard({
  mode,
  client,
  type,
  api,
  disabled = false,
  className,
}: ClientDeliveryCardProps) {
  const { t } = useTranslation();
  const isPharmacy = type === "PHARMACY";

  if (mode === "view" || !api) {
    const start = client?.deliveryWindowStart ?? null;
    const end = client?.deliveryWindowEnd ?? null;
    const pharmacy = client && isPharmacyClient(client) ? client : null;
    const hasKey = Boolean(pharmacy?.numero?.trim() || pharmacy?.color?.trim());
    const carrier = pharmacy?.doubleCleTransporteur === true;
    const sender = pharmacy?.doubleCleExpediteur === true;
    const instructions = client?.informations?.trim() ?? "";

    return (
      <SectionCard
        title={t("clients.sections.delivery")}
        description={t("clients.sections.deliveryDesc")}
        icon={Truck}
        className={className}
        contentClassName="flex flex-col gap-3"
      >
        <FieldRow
          icon={Clock}
          label={t("deliveryWindow.label")}
          summary={windowSummary(start, end, t)}
          active={Boolean(start) || Boolean(end)}
        />
        {pharmacy && (
          <>
            <FieldRow
              icon={KeyRound}
              label={t("clients.info.key")}
              summary={keySummary(pharmacy.numero, pharmacy.color, t)}
              active={hasKey}
              control={
                hasKey ? (
                  <KeyTag
                    color={pharmacy.color}
                    numero={pharmacy.numero}
                    size="md"
                  />
                ) : undefined
              }
            />
            <FieldRow
              icon={Truck}
              label={t("clients.info.doubleKeyCarrier")}
              summary={t(
                carrier
                  ? "clients.info.doubleKeyCarrierHint"
                  : "clients.info.doubleKeyCarrierOff"
              )}
              active={carrier}
              control={<ReadOnlyFlag checked={carrier} />}
            />
            <FieldRow
              icon={Building2}
              label={t("clients.info.doubleKeySender")}
              summary={t(
                sender
                  ? "clients.info.doubleKeySenderHint"
                  : "clients.info.doubleKeySenderOff"
              )}
              active={sender}
              control={<ReadOnlyFlag checked={sender} />}
            />
          </>
        )}
        <dl className="mt-1">
          <DetailField label={t("clients.fields.informations")}>
            {instructions ? (
              <span className="whitespace-pre-line break-words">
                {instructions}
              </span>
            ) : null}
          </DetailField>
        </dl>
      </SectionCard>
    );
  }

  const { form } = api;
  const hasKey = Boolean(form.numero.trim() || form.color.trim());
  const colorId = clientFieldId(api.idPrefix, "color");

  return (
    <SectionCard
      title={t("clients.sections.delivery")}
      description={t("clients.sections.deliveryDesc")}
      icon={Truck}
      className={className}
      contentClassName="flex flex-col gap-3"
    >
      <DeliveryWindowFields
        idPrefix={api.idPrefix}
        form={form}
        errors={api.errors}
        onChange={api.setWindow}
      />

      {isPharmacy && (
        <>
          <FieldRow
            icon={KeyRound}
            label={t("clients.info.key")}
            summary={keySummary(form.numero, form.color, t)}
            active={hasKey}
            control={
              hasKey ? (
                <KeyTag color={form.color} numero={form.numero} size="md" />
              ) : undefined
            }
          >
            <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-[10rem_minmax(0,1fr)]">
              <ClientTextField
                api={api}
                field="numero"
                label={t("clients.fields.numero")}
                disabled={disabled}
                className="tabular-nums"
              />
              <FormField
                label={t("clients.fields.color")}
                htmlFor={colorId}
                error={api.errors.color}
              >
                <KeyColorInput
                  id={colorId}
                  value={form.color}
                  onChange={(next) => api.set("color", next)}
                />
              </FormField>
            </div>
          </FieldRow>

          <SwitchRow
            id={clientFieldId(api.idPrefix, "doubleCleTransporteur")}
            icon={Truck}
            label={t("clients.info.doubleKeyCarrier")}
            summary={t(
              form.doubleCleTransporteur
                ? "clients.info.doubleKeyCarrierHint"
                : "clients.info.doubleKeyCarrierOff"
            )}
            checked={form.doubleCleTransporteur}
            onCheckedChange={(checked) =>
              api.set("doubleCleTransporteur", checked)
            }
            disabled={disabled}
          />
          <SwitchRow
            id={clientFieldId(api.idPrefix, "doubleCleExpediteur")}
            icon={Building2}
            label={t("clients.info.doubleKeySender")}
            summary={t(
              form.doubleCleExpediteur
                ? "clients.info.doubleKeySenderHint"
                : "clients.info.doubleKeySenderOff"
            )}
            checked={form.doubleCleExpediteur}
            onCheckedChange={(checked) => api.set("doubleCleExpediteur", checked)}
            disabled={disabled}
          />
        </>
      )}

      <ClientTextArea
        api={api}
        field="informations"
        label={t("clients.fields.informations")}
        hint={t("clients.info.informationsHint")}
        placeholder={t("clients.info.informationsPlaceholder")}
        disabled={disabled}
        fieldClassName="mt-1"
      />
    </SectionCard>
  );
}
