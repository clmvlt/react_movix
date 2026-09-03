import { useTranslation } from "react-i18next";
import {
  CalendarClock,
  Euro,
  ExternalLink,
  Pencil,
  Route as RouteIcon,
  ScanBarcode,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DetailField } from "@/components/detail-field";
import { FieldRow, SwitchRow } from "@/components/field-row";
import { SectionCard } from "@/components/section-card";
import { safeCategoryColor } from "@/lib/colors";
import { formatDate } from "@/lib/date";
import type { CommandDetail } from "@/features/commands";

interface CommandShippingCardProps {
  command: CommandDetail;
  locked: boolean;
  isAdmin: boolean;
  forcedPending: boolean;
  onChangeDate: () => void;
  onOpenTour: () => void;
  onToggleForced: (checked: boolean) => void;
  onEditTarif: () => void;
  className?: string;
}

function formatTarif(value: number, lang: string): string {
  return new Intl.NumberFormat(lang.startsWith("fr") ? "fr-FR" : "en-GB", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export function CommandShippingCard({
  command,
  locked,
  isAdmin,
  forcedPending,
  onChangeDate,
  onOpenTour,
  onToggleForced,
  onEditTarif,
  className,
}: CommandShippingCardProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? "en";
  const tour = command.tour ?? null;
  const forced = command.isForced === true;

  let tourSummary = t("commands.detail.noTour");
  if (tour && command.tourOrder != null) {
    tourSummary = t("commands.detail.tourStop", {
      name: tour.name,
      order: command.tourOrder,
    });
  } else if (tour) {
    tourSummary = tour.name;
  }

  return (
    <SectionCard
      title={t("commands.sections.shipping")}
      description={t("commands.sections.shippingDesc")}
      icon={Truck}
      className={className}
      contentClassName="flex flex-col gap-3"
    >
      <FieldRow
        icon={CalendarClock}
        label={t("commands.expDate")}
        summary={formatDate(command.expDate, lang)}
        active
        control={
          <Button
            type="button"
            variant="outline"
            className="min-h-11 shrink-0 lg:min-h-10"
            disabled={locked}
            aria-label={t("expeditions.changeExpDate")}
            onClick={onChangeDate}
          >
            <Pencil className="size-4" />
            {t("common.edit")}
          </Button>
        }
      />

      <FieldRow
        icon={RouteIcon}
        label={
          <span className="flex items-center gap-2">
            {tour && (
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-full"
                style={{
                  backgroundColor: safeCategoryColor(
                    tour.color ?? command.tourColor
                  ),
                }}
              />
            )}
            {t("expeditions.tourLabel")}
          </span>
        }
        summary={tourSummary}
        active={Boolean(tour)}
        control={
          tour ? (
            <Button
              type="button"
              variant="outline"
              className="min-h-10 shrink-0"
              aria-label={t("commands.detail.openTour")}
              onClick={onOpenTour}
            >
              <ExternalLink className="size-4" />
              {t("expeditions.open")}
            </Button>
          ) : undefined
        }
      />

      <SwitchRow
        id="command-forced"
        icon={ScanBarcode}
        label={t("commands.forced")}
        summary={t(
          forced ? "commands.detail.forcedOn" : "commands.detail.forcedOff"
        )}
        checked={forced}
        onCheckedChange={onToggleForced}
        disabled={locked || forcedPending}
      />

      <FieldRow
        icon={Euro}
        label={t("commands.tarif")}
        summary={
          command.tarif != null
            ? formatTarif(command.tarif, lang)
            : t("commands.detail.noTarif")
        }
        active={command.tarif != null}
        control={
          isAdmin ? (
            <Button
              type="button"
              variant="outline"
              className="min-h-10 shrink-0"
              disabled={locked}
              aria-label={t("commands.tarifDialog.title")}
              onClick={onEditTarif}
            >
              <Pencil className="size-4" />
              {t("common.edit")}
            </Button>
          ) : undefined
        }
      />

      <dl className="mt-1">
        <DetailField label={t("commands.closeDate")}>
          {command.closeDate ? formatDate(command.closeDate, lang) : null}
        </DetailField>
      </dl>
    </SectionCard>
  );
}
