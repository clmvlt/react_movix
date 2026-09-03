import { useTranslation } from "react-i18next";
import {
  Building2,
  Check,
  Clock,
  KeyRound,
  Minus,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { DetailField } from "@/components/detail-field";
import { FormField } from "@/components/form-field";
import { FieldRow, SwitchRow } from "@/components/field-row";
import { DeliveryWindowFields } from "@/components/pharmacies/delivery-window-fields";
import { PharmacyColorInput } from "@/components/pharmacies/pharmacy-color-input";
import { PharmacyTag } from "@/components/pharmacies/pharmacy-tag";
import {
  PharmacyTextArea,
  PharmacyTextField,
  SectionCard,
} from "@/components/pharmacies/pharmacy-fields";
import { pharmacyFieldId } from "@/components/pharmacies/pharmacy-form";
import type { PharmacyFormApi } from "@/components/pharmacies/use-pharmacy-form";
import type { Pharmacy } from "@/features/pharmacies";

interface PharmacyDeliveryCardProps {
  mode: "view" | "edit" | "create";
  pharmacy: Pharmacy | null;
  api?: PharmacyFormApi;
  disabled?: boolean;
  className?: string;
}

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
  t: (key: string, options?: Record<string, unknown>) => string
): string {
  if (start && end) return t("deliveryWindow.summaryRange", { start, end });
  if (start) return t("deliveryWindow.summaryFrom", { start });
  if (end) return t("deliveryWindow.summaryUntil", { end });
  return t("deliveryWindow.none");
}

function keySummary(
  numero: string | null | undefined,
  color: string | null | undefined,
  t: (key: string, options?: Record<string, unknown>) => string
): string {
  const number = numero?.trim();
  if (number) return t("pharmacies.info.keySummary", { numero: number });
  if (color?.trim()) return t("pharmacies.info.keyColorOnly");
  return t("pharmacies.info.keyNone");
}

const CARRIER_ICON: LucideIcon = Truck;
const SENDER_ICON: LucideIcon = Building2;

export function PharmacyDeliveryCard({
  mode,
  pharmacy,
  api,
  disabled = false,
  className,
}: PharmacyDeliveryCardProps) {
  const { t } = useTranslation();

  if (mode === "view" || !api) {
    const start = pharmacy?.deliveryWindowStart ?? null;
    const end = pharmacy?.deliveryWindowEnd ?? null;
    const hasWindow = Boolean(start) || Boolean(end);
    const hasKey = Boolean(pharmacy?.numero?.trim() || pharmacy?.color?.trim());
    const carrier = pharmacy?.doubleCleTransporteur === true;
    const sender = pharmacy?.doubleCleExpediteur === true;
    const instructions = pharmacy?.informations?.trim() ?? "";

    return (
      <SectionCard
        title={t("pharmacies.sections.delivery")}
        description={t("pharmacies.sections.deliveryDesc")}
        icon={Truck}
        className={className}
        contentClassName="flex flex-col gap-3"
      >
        <FieldRow
          icon={Clock}
          label={t("deliveryWindow.label")}
          summary={windowSummary(start, end, t)}
          active={hasWindow}
        />
        <FieldRow
          icon={KeyRound}
          label={t("pharmacies.info.key")}
          summary={keySummary(pharmacy?.numero, pharmacy?.color, t)}
          active={hasKey}
          control={
            hasKey ? (
              <PharmacyTag
                color={pharmacy?.color}
                numero={pharmacy?.numero}
                size="md"
              />
            ) : undefined
          }
        />
        <FieldRow
          icon={CARRIER_ICON}
          label={t("pharmacies.info.doubleKeyCarrier")}
          summary={t(
            carrier
              ? "pharmacies.info.doubleKeyCarrierHint"
              : "pharmacies.info.doubleKeyCarrierOff"
          )}
          active={carrier}
          control={<ReadOnlyFlag checked={carrier} />}
        />
        <FieldRow
          icon={SENDER_ICON}
          label={t("pharmacies.info.doubleKeySender")}
          summary={t(
            sender
              ? "pharmacies.info.doubleKeySenderHint"
              : "pharmacies.info.doubleKeySenderOff"
          )}
          active={sender}
          control={<ReadOnlyFlag checked={sender} />}
        />
        <dl className="mt-1">
          <DetailField label={t("pharmacies.info.informations")}>
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
  const colorId = pharmacyFieldId(api.idPrefix, "color");

  return (
    <SectionCard
      title={t("pharmacies.sections.delivery")}
      description={t("pharmacies.sections.deliveryDesc")}
      icon={Truck}
      className={className}
      contentClassName="flex flex-col gap-3"
    >
      <DeliveryWindowFields
        idPrefix={api.idPrefix}
        form={form}
        errors={api.errors}
        onChange={api.set}
      />

      <FieldRow
        icon={KeyRound}
        label={t("pharmacies.info.key")}
        summary={keySummary(form.numero, form.color, t)}
        active={hasKey}
        control={
          hasKey ? (
            <PharmacyTag color={form.color} numero={form.numero} size="md" />
          ) : undefined
        }
      >
        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-[10rem_minmax(0,1fr)]">
          <PharmacyTextField
            api={api}
            field="numero"
            label={t("pharmacies.info.numero")}
            disabled={disabled}
            className="tabular-nums"
          />
          <FormField
            label={t("pharmacies.info.color")}
            htmlFor={colorId}
            error={api.errors.color}
          >
            <PharmacyColorInput
              id={colorId}
              value={form.color}
              onChange={(next) => api.set("color", next)}
            />
          </FormField>
        </div>
      </FieldRow>

      <SwitchRow
        id={pharmacyFieldId(api.idPrefix, "doubleCleTransporteur")}
        icon={CARRIER_ICON}
        label={t("pharmacies.info.doubleKeyCarrier")}
        summary={t(
          form.doubleCleTransporteur
            ? "pharmacies.info.doubleKeyCarrierHint"
            : "pharmacies.info.doubleKeyCarrierOff"
        )}
        checked={form.doubleCleTransporteur}
        onCheckedChange={(checked) => api.set("doubleCleTransporteur", checked)}
        disabled={disabled}
      />
      <SwitchRow
        id={pharmacyFieldId(api.idPrefix, "doubleCleExpediteur")}
        icon={SENDER_ICON}
        label={t("pharmacies.info.doubleKeySender")}
        summary={t(
          form.doubleCleExpediteur
            ? "pharmacies.info.doubleKeySenderHint"
            : "pharmacies.info.doubleKeySenderOff"
        )}
        checked={form.doubleCleExpediteur}
        onCheckedChange={(checked) => api.set("doubleCleExpediteur", checked)}
        disabled={disabled}
      />

      <PharmacyTextArea
        api={api}
        field="informations"
        label={t("pharmacies.info.informations")}
        hint={t("pharmacies.info.informationsHint")}
        placeholder={t("pharmacies.info.informationsPlaceholder")}
        disabled={disabled}
        fieldClassName="mt-1"
      />
    </SectionCard>
  );
}
