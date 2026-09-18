import { Suspense, lazy } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { MapPin, MapPinOff, MapPinPlus, Signature } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeliveryWindowBadge } from "@/components/delivery-window-badge";
import { DetailField } from "@/components/detail-field";
import { InlineSpinner } from "@/components/full-page-spinner";
import { SectionCard } from "@/components/section-card";
import { entityPosition } from "@/lib/address-form";
import { commandMapColors } from "@/lib/colors";
import { distanceMeters } from "@/lib/geo";
import { formatDateTime } from "@/lib/date";
import { coarsePointer } from "@/lib/pointer";
import type { LngLat } from "@/components/map";
import {
  commandRecipient,
  partyLabel,
  type CommandDetail,
  type CommandProof,
} from "@/features/commands";

const CommandMap = lazy(() =>
  import("@/components/commands/command-map").then((m) => ({
    default: m.CommandMap,
  }))
);

const MAP_BOX =
  "relative h-48 shrink-0 overflow-hidden rounded-xl border border-border sm:h-56 lg:h-auto lg:min-h-40 lg:flex-1";

const EMPTY_BOX =
  "flex h-48 shrink-0 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border p-4 text-center sm:h-56 lg:h-auto lg:min-h-40 lg:flex-1";

interface CommandDeliveryCardProps {
  command: CommandDetail;
  depot: LngLat | null;
  depotTitle?: string;
  className?: string;
}

function formatGap(meters: number, lang: string): string {
  if (meters < 1000) {
    return `${new Intl.NumberFormat(lang).format(Math.round(meters))} m`;
  }
  return `${new Intl.NumberFormat(lang, { maximumFractionDigits: 1 }).format(meters / 1000)} km`;
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      <span
        aria-hidden
        className="size-2.5 shrink-0 rounded-full border border-border"
        style={{ backgroundColor: color }}
      />
      <span className="truncate">{label}</span>
    </span>
  );
}

function ProofBlock({
  label,
  proof,
  reference,
}: {
  label: string;
  proof: CommandProof | null | undefined;
  reference: LngLat | null;
}) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? "en";
  const position = entityPosition(proof);
  const signature = proof?.signatureImageUrl?.trim() || null;
  const signatureName = proof?.signatureName?.trim() || null;
  const gap =
    position && reference ? distanceMeters(position, reference) : null;

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs font-medium uppercase text-muted-foreground">
          {label}
        </p>
        <p className="text-sm tabular-nums text-foreground">
          {proof?.at
            ? formatDateTime(proof.at, lang)
            : t("commands.proofs.pending")}
        </p>
      </div>

      {gap != null && (
        <p className="text-xs text-muted-foreground">
          {t("commands.proofs.gap", { distance: formatGap(gap, lang) })}
        </p>
      )}

      {proof && !position && (
        <p className="text-xs text-muted-foreground">
          {t("commands.proofs.noPosition")}
        </p>
      )}

      {signature ? (
        <figure className="flex flex-col gap-1">
          <img
            src={signature}
            alt={t("commands.proofs.signatureAlt")}
            loading="lazy"
            className="h-20 w-full rounded-md border border-border bg-muted object-contain dark:invert"
          />
          <figcaption className="text-xs text-muted-foreground">
            {signatureName ?? t("commands.proofs.signatureUnknown")}
          </figcaption>
        </figure>
      ) : (
        proof && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Signature aria-hidden className="size-3.5 shrink-0" />
            {signatureName ?? t("commands.proofs.noSignature")}
          </p>
        )
      )}
    </div>
  );
}

export function CommandDeliveryCard({
  command,
  depot,
  depotTitle,
  className,
}: CommandDeliveryCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const sender = command.sender ?? null;
  const recipient = commandRecipient(command);

  const senderAddress = entityPosition(sender);
  const recipientAddress = entityPosition(recipient);
  const loadingPoint = entityPosition(command.loading);
  const deliveryPoint = entityPosition(command.delivery);

  const hasPoints = Boolean(
    senderAddress || recipientAddress || loadingPoint || deliveryPoint
  );
  const recipientClientId = recipient?.linked ? recipient.clientId : null;
  const note = command.pharmacyCommentaire?.trim() ?? "";

  return (
    <SectionCard
      title={t("commands.proofs.title")}
      icon={MapPin}
      className={className}
      contentClassName="flex min-h-0 flex-1 flex-col gap-4 lg:overflow-y-auto"
    >
      {hasPoints ? (
        <>
          <div className={MAP_BOX}>
            <Suspense fallback={<InlineSpinner />}>
              <CommandMap
                senderAddress={senderAddress}
                recipientAddress={recipientAddress}
                loadingPoint={loadingPoint}
                deliveryPoint={deliveryPoint}
                senderTitle={partyLabel(sender) || undefined}
                recipientTitle={partyLabel(recipient) || undefined}
                depot={depot}
                depotTitle={depotTitle}
                cooperativeGestures={coarsePointer()}
              />
            </Suspense>
          </div>
          <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            {senderAddress && (
              <li>
                <LegendItem
                  color={commandMapColors.sender}
                  label={t("commands.proofs.legendSender")}
                />
              </li>
            )}
            {loadingPoint && (
              <li>
                <LegendItem
                  color={commandMapColors.sender}
                  label={t("commands.proofs.legendLoading")}
                />
              </li>
            )}
            {recipientAddress && (
              <li>
                <LegendItem
                  color={commandMapColors.recipient}
                  label={t("commands.proofs.legendRecipient")}
                />
              </li>
            )}
            {deliveryPoint && (
              <li>
                <LegendItem
                  color={commandMapColors.recipient}
                  label={t("commands.proofs.legendDelivery")}
                />
              </li>
            )}
          </ul>
        </>
      ) : (
        <div className={EMPTY_BOX}>
          <MapPinOff aria-hidden className="size-8 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">
            {t("commands.proofs.noPoints")}
          </p>
          {recipientClientId && (
            <Button
              type="button"
              variant="outline"
              className="min-h-11 lg:min-h-10"
              onClick={() =>
                navigate(
                  `/app/clients/${encodeURIComponent(recipientClientId)}?edit=1&focus=position`
                )
              }
            >
              <MapPinPlus className="size-4" />
              {t("clients.info.setPosition")}
            </Button>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <DeliveryWindowBadge
          start={command.pharmacyDeliveryWindowStart}
          end={command.pharmacyDeliveryWindowEnd}
          className="w-fit"
        />
        {note && (
          <dl>
            <DetailField label={t("clients.fields.commentaire")}>
              <span className="whitespace-pre-line break-words">{note}</span>
            </DetailField>
          </dl>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <ProofBlock
          label={t("commands.proofs.loading")}
          proof={command.loading}
          reference={senderAddress}
        />
        <ProofBlock
          label={t("commands.proofs.delivery")}
          proof={command.delivery}
          reference={recipientAddress}
        />
      </div>
    </SectionCard>
  );
}
