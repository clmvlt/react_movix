import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Package,
  PackageCheck,
  Link2,
  PencilLine,
  Plus,
  Truck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DetailField } from "@/components/detail-field";
import { EmptyState } from "@/components/states";
import { SectionCard } from "@/components/section-card";
import { ClientTypeIcon } from "@/components/clients/client-type-icon";
import { cn } from "@/lib/utils";
import {
  partyAddressLines,
  partyLabel,
  type CommandParty,
} from "@/features/commands";

interface CommandPartyCardProps {
  role: "sender" | "recipient";
  party: CommandParty | null;
  className?: string;
}

const ROLE_ICON = { sender: Truck, recipient: PackageCheck } as const;

const ROLE_EMPTY = {
  sender: "commands.parties.noSender",
  recipient: "commands.parties.noRecipient",
} as const;

export function CommandPartyCard({
  role,
  party,
  className,
}: CommandPartyCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const addressLines = partyAddressLines(party);
  const phone = party?.phone?.trim() ?? "";
  const email = party?.email?.trim() ?? "";
  const cip = party?.clientType === "PHARMACY" ? party.cip?.trim() : null;
  const clientId = party?.linked ? party.clientId : null;

  return (
    <SectionCard
      title={t(`commands.parties.${role}`)}
      description={t(`commands.parties.${role}Hint`)}
      icon={ROLE_ICON[role]}
      className={cn("h-full", className)}
      contentClassName="flex flex-1 flex-col gap-4"
      extra={
        party ? (
          <span className="flex flex-wrap items-center justify-end gap-1.5">
            {party.clientType && (
              <Badge variant="outline" className="shrink-0 gap-1.5">
                <ClientTypeIcon type={party.clientType} className="size-3.5" />
                {t(`clients.types.${party.clientType}`)}
              </Badge>
            )}
            <Badge
              variant={party.linked ? "outline" : "secondary"}
              className="shrink-0 gap-1.5"
            >
              {party.linked ? (
                <Link2 aria-hidden className="size-3.5" />
              ) : (
                <PencilLine aria-hidden className="size-3.5" />
              )}
              {party.linked
                ? t("commands.parties.linked")
                : t("commands.parties.free")}
            </Badge>
          </span>
        ) : undefined
      }
    >
      {!party ? (
        <EmptyState
          message={t(ROLE_EMPTY[role])}
          className="py-10"
          icon={<PencilLine className="size-8" />}
        />
      ) : (
        <>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-foreground">
              {partyLabel(party) || t("clients.untitled")}
            </p>
            {addressLines.length > 0 && (
              <p className="text-sm text-foreground">
                {addressLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </p>
            )}
          </div>

          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {cip && (
              <DetailField label={t("clients.fields.cip")}>
                <span className="tabular-nums">{cip}</span>
              </DetailField>
            )}
            <DetailField label={t("clients.fields.phone")}>
              {phone ? (
                <a
                  href={`tel:${phone}`}
                  className="tabular-nums text-primary underline underline-offset-4"
                >
                  {phone}
                </a>
              ) : null}
            </DetailField>
            <DetailField label={t("clients.fields.email")}>
              {email ? (
                <a
                  href={`mailto:${email}`}
                  className="break-all text-primary underline underline-offset-4"
                >
                  {email}
                </a>
              ) : null}
            </DetailField>
          </dl>

          <div className="mt-auto flex flex-col gap-2 pt-2">
            {clientId ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 w-full lg:min-h-10"
                  onClick={() =>
                    navigate(`/app/clients/${encodeURIComponent(clientId)}`)
                  }
                >
                  <Building2 className="size-4" />
                  {t("commands.parties.openClient")}
                </Button>
                {role === "recipient" && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      className="min-h-11 w-full lg:min-h-10"
                      onClick={() =>
                        navigate(
                          `/app/commands?mode=detailed&client=${encodeURIComponent(clientId)}`
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
                        navigate(
                          `/app/commands/new?client=${encodeURIComponent(clientId)}`
                        )
                      }
                    >
                      <Plus className="size-4" />
                      {t("commands.create.forPharmacy")}
                    </Button>
                  </>
                )}
              </>
            ) : (
              <p className="text-xs leading-4 text-muted-foreground">
                {t("commands.parties.freeNotice")}
              </p>
            )}
          </div>
        </>
      )}
    </SectionCard>
  );
}
