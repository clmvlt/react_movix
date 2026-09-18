import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Building2, Package, ReceiptText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/section-card";
import { ClientTypeIcon } from "@/components/clients/client-type-icon";
import { addressLines } from "@/lib/address-form";
import { cn } from "@/lib/utils";
import { clientLabel, isPharmacyClient } from "@/features/clients";
import { commandRecipient, type CommandDetail } from "@/features/commands";
import { CommandPartyCard } from "./command-party-card";

interface CommandPartiesProps {
  command: CommandDetail;
  className?: string;
}

export function CommandParties({ command, className }: CommandPartiesProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const orderer = command.orderer ?? null;
  const ordererLines = orderer ? addressLines(orderer) : [];
  const ordererCip =
    orderer && isPharmacyClient(orderer) ? orderer.cip : null;
  const ordererCode = orderer?.code?.trim() || null;

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <SectionCard
        title={t("commands.parties.orderer")}
        description={t("commands.parties.ordererHint")}
        icon={ReceiptText}
        extra={
          orderer ? (
            <Badge variant="outline" className="shrink-0 gap-1.5">
              <ClientTypeIcon type={orderer.type} className="size-3.5" />
              {t(`clients.types.${orderer.type}`)}
            </Badge>
          ) : undefined
        }
        contentClassName="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
      >
        {orderer ? (
          <>
            <div className="flex min-w-0 flex-col gap-1">
              <p className="text-sm font-medium text-foreground">
                {clientLabel(orderer) || t("clients.untitled")}
              </p>
              <p className="text-sm text-muted-foreground">
                {[ordererCode, ordererCip, ...ordererLines]
                  .filter(Boolean)
                  .join(" - ")}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row lg:shrink-0">
              <Button
                type="button"
                variant="outline"
                className="min-h-11 lg:min-h-10"
                onClick={() =>
                  navigate(`/app/clients/${encodeURIComponent(orderer.id)}`)
                }
              >
                <Building2 className="size-4" />
                {t("commands.parties.openClient")}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 lg:min-h-10"
                onClick={() =>
                  navigate(
                    `/app/commands?orderer=${encodeURIComponent(orderer.id)}`
                  )
                }
              >
                <Package className="size-4" />
                {t("commands.parties.ordererOrders")}
              </Button>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t("commands.parties.noOrderer")}
          </p>
        )}
      </SectionCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CommandPartyCard role="sender" party={command.sender ?? null} />
        <CommandPartyCard role="recipient" party={commandRecipient(command)} />
      </div>
    </div>
  );
}
