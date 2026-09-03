import { Suspense, lazy } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Building2, MapPinOff, MapPinPlus, Package, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeliveryWindowBadge } from "@/components/delivery-window-badge";
import { DetailField } from "@/components/detail-field";
import { InlineSpinner } from "@/components/full-page-spinner";
import { SectionCard } from "@/components/section-card";
import { PharmacyTag } from "@/components/pharmacies/pharmacy-tag";
import { pharmacyPosition } from "@/components/pharmacies/pharmacy-form";
import { coarsePointer } from "@/lib/pointer";
import type { LngLat } from "@/components/map";
import type { CommandDetail } from "@/features/commands";

const PharmacyMap = lazy(() =>
  import("@/components/pharmacies/pharmacy-map").then((m) => ({
    default: m.PharmacyMap,
  }))
);

const MAP_BOX =
  "relative h-48 shrink-0 overflow-hidden rounded-xl border border-border sm:h-56 lg:h-auto lg:min-h-40 lg:flex-1";

interface CommandPharmacyCardProps {
  command: CommandDetail;
  depot: LngLat | null;
  depotTitle?: string;
  className?: string;
}

export function CommandPharmacyCard({
  command,
  depot,
  depotTitle,
  className,
}: CommandPharmacyCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const pharmacy = command.pharmacy ?? null;
  const cip = pharmacy?.cip?.trim() ?? "";
  const position = pharmacyPosition(pharmacy);
  const name = pharmacy?.name?.trim() || t("commands.noPharmacy");
  const addressLines = [
    pharmacy?.address1,
    [pharmacy?.postalCode, pharmacy?.city].filter(Boolean).join(" "),
  ]
    .map((line) => line?.trim() ?? "")
    .filter(Boolean);
  const phone = pharmacy?.phone?.trim() ?? "";
  const email = pharmacy?.email?.trim() ?? "";
  const note = command.pharmacyCommentaire?.trim() ?? "";
  const pharmacyPath = cip ? `/app/pharmacies/${encodeURIComponent(cip)}` : "";

  return (
    <SectionCard
      title={t("commands.pharmacy")}
      icon={Building2}
      className={className}
      contentClassName="flex min-h-0 flex-1 flex-col gap-4 lg:overflow-y-auto"
      extra={
        pharmacy ? (
          <span className="flex flex-wrap items-center justify-end gap-2">
            <PharmacyTag
              color={pharmacy.color}
              numero={pharmacy.numero}
              size="md"
            />
            {command.newPharmacy && (
              <Badge>{t("commands.newPharmacyTitle")}</Badge>
            )}
          </span>
        ) : undefined
      }
    >
      {position ? (
        <div className={MAP_BOX}>
          <Suspense fallback={<InlineSpinner />}>
            <PharmacyMap
              marker={position}
              title={name}
              depot={depot}
              depotTitle={depotTitle}
              fitAnchor={position}
              cooperativeGestures={coarsePointer()}
            />
          </Suspense>
        </div>
      ) : (
        <div className="flex h-48 shrink-0 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border p-4 text-center sm:h-56 lg:h-auto lg:min-h-40 lg:flex-1">
          <MapPinOff aria-hidden className="size-8 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">
            {t("pharmacies.info.noCoordinates")}
          </p>
          {cip && (
            <Button
              type="button"
              variant="outline"
              className="min-h-11 lg:min-h-10"
              onClick={() => navigate(`${pharmacyPath}?edit=1&focus=position`)}
            >
              <MapPinPlus className="size-4" />
              {t("pharmacies.info.setPosition")}
            </Button>
          )}
        </div>
      )}

      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-foreground">{name}</p>
        {addressLines.length > 0 && (
          <p className="text-sm text-foreground">
            {addressLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </p>
        )}
        <DeliveryWindowBadge
          start={command.pharmacyDeliveryWindowStart}
          end={command.pharmacyDeliveryWindowEnd}
          className="mt-1 w-fit"
        />
      </div>

      <dl className="grid grid-cols-1 gap-4">
        <DetailField label={t("common.phone")}>
          {phone ? (
            <a
              href={`tel:${phone}`}
              className="tabular-nums text-primary underline underline-offset-4"
            >
              {phone}
            </a>
          ) : null}
        </DetailField>
        <DetailField label={t("common.email")}>
          {email ? (
            <a
              href={`mailto:${email}`}
              className="break-all text-primary underline underline-offset-4"
            >
              {email}
            </a>
          ) : null}
        </DetailField>
        {note && (
          <DetailField label={t("pharmacies.info.commentaire")}>
            <span className="whitespace-pre-line break-words">{note}</span>
          </DetailField>
        )}
      </dl>

      {cip && (
        <div className="flex flex-col gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            className="min-h-11 w-full lg:min-h-10"
            onClick={() => navigate(pharmacyPath)}
          >
            <Building2 className="size-4" />
            {t("commands.openPharmacy")}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-11 w-full lg:min-h-10"
            onClick={() =>
              navigate(
                `/app/commands?mode=detailed&cip=${encodeURIComponent(cip)}`
              )
            }
          >
            <Package className="size-4" />
            {t("commands.pharmacyOrders")}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-11 w-full lg:min-h-10"
            onClick={() =>
              navigate(`/app/commands/new?cip=${encodeURIComponent(cip)}`)
            }
          >
            <Plus className="size-4" />
            {t("commands.create.forPharmacy")}
          </Button>
        </div>
      )}
    </SectionCard>
  );
}
