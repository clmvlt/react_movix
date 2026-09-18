import { useTranslation } from "react-i18next";
import { Camera, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/states";
import { PictureGrid } from "@/components/picture-grid";
import { SectionCard } from "@/components/section-card";
import { CommandCommentCard } from "@/components/commands/command-comment-card";
import { CommandParcelsTable } from "@/components/commands/command-parcels-table";
import { CommandDeliveryCard } from "@/components/commands/command-delivery-card";
import { CommandParties } from "@/components/commands/command-parties";
import { CommandRecentCard } from "@/components/commands/command-recent-card";
import { CommandShippingCard } from "@/components/commands/command-shipping-card";
import { CommandStatusCard } from "@/components/commands/command-status-card";
import type { LngLat } from "@/components/map";
import {
  commandRecipient,
  type CommandBasic,
  type CommandDetail,
} from "@/features/commands";

interface CommandSectionsProps {
  command: CommandDetail;
  locked: boolean;
  isAdmin: boolean;
  depot: LngLat | null;
  depotTitle?: string;
  recentCommands: CommandBasic[];
  recentLoading: boolean;
  forcedPending: boolean;
  onChangeDate: () => void;
  onChangeStatus: () => void;
  onEditComment: () => void;
  onEditTarif: () => void;
  onToggleForced: (checked: boolean) => void;
  onOpenTour: () => void;
  onRefresh: () => void;
  onOpenCommand: (id: string) => void;
  onOpenPharmacyOrders: () => void;
}

const MAIN_COLUMN = "lg:col-span-2";
const STICKY_CARD = "lg:h-[calc(100dvh-5.5rem)]";

export function CommandSections({
  command,
  locked,
  isAdmin,
  depot,
  depotTitle,
  recentCommands,
  recentLoading,
  forcedPending,
  onChangeDate,
  onChangeStatus,
  onEditComment,
  onEditTarif,
  onToggleForced,
  onOpenTour,
  onRefresh,
  onOpenCommand,
  onOpenPharmacyOrders,
}: CommandSectionsProps) {
  const { t } = useTranslation();
  const parcels = command.packages ?? [];
  const pictures = command.pictures ?? [];
  const recipient = commandRecipient(command);

  return (
    <div className="flex flex-col gap-4">
      <CommandParties command={command} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <CommandShippingCard
          command={command}
          locked={locked}
          isAdmin={isAdmin}
          forcedPending={forcedPending}
          onChangeDate={onChangeDate}
          onOpenTour={onOpenTour}
          onToggleForced={onToggleForced}
          onEditTarif={onEditTarif}
          className={MAIN_COLUMN}
        />
        <CommandStatusCard
          command={command}
          locked={locked}
          onChangeStatus={onChangeStatus}
          className={MAIN_COLUMN}
        />
        <CommandCommentCard
          comment={command.comment}
          locked={locked}
          onEdit={onEditComment}
          className={MAIN_COLUMN}
        />
        <SectionCard
          title={t("commands.detail.parcels")}
          icon={Package}
          className={MAIN_COLUMN}
          extra={
            <Badge variant="outline" className="shrink-0 tabular-nums">
              {parcels.length}
            </Badge>
          }
        >
          {parcels.length === 0 ? (
            <EmptyState message={t("commands.detail.noParcels")} />
          ) : (
            <CommandParcelsTable
              parcels={parcels}
              allowSouffrance={!locked}
              onSouffranceDone={onRefresh}
              allowStatusChange={!locked}
              onStatusDone={onRefresh}
              tableFrom="xl"
            />
          )}
        </SectionCard>
        <div className="lg:col-start-3 lg:row-span-6 lg:row-start-1">
          <div className="lg:sticky lg:top-4">
            <CommandDeliveryCard
              command={command}
              depot={depot}
              depotTitle={depotTitle}
              className={STICKY_CARD}
            />
          </div>
        </div>
        <SectionCard
          title={t("commands.detail.pictures")}
          icon={Camera}
          className={MAIN_COLUMN}
          extra={
            <Badge variant="outline" className="shrink-0 tabular-nums">
              {pictures.length}
            </Badge>
          }
        >
          <PictureGrid
            pictures={pictures}
            emptyMessage={t("commands.detail.noPictures")}
          />
        </SectionCard>
        <CommandRecentCard
          commands={recentCommands}
          loading={recentLoading}
          hasPharmacy={Boolean(recipient?.clientId)}
          onOpen={onOpenCommand}
          onOpenAll={onOpenPharmacyOrders}
          className={MAIN_COLUMN}
        />
      </div>
    </div>
  );
}
