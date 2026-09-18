import { cn } from "@/lib/utils";
import { ClientAddressCard } from "./client-address-card";
import { ClientBillingCard } from "./client-billing-card";
import { ClientContactCard } from "./client-contact-card";
import { ClientDeliveryCard } from "./client-delivery-card";
import { ClientIdentityCard } from "./client-identity-card";
import { ClientNoteCard } from "./client-note-card";
import { ClientPhotosCard } from "./client-photos-card";
import { ClientPositionCard } from "./client-position-card";
import type { ClientFormApi } from "./use-client-form";
import type { Client, ClientPicture, ClientType } from "@/features/clients";
import type { CommandMapPoint } from "@/lib/command-points";
import type { Zone } from "@/features/zones";
import type { LngLat } from "@/components/map";

interface ClientSectionsProps {
  mode: "view" | "edit" | "create";
  client: Client | null;
  type: ClientType;
  api?: ClientFormApi;
  zones: Zone[];
  depot: LngLat | null;
  depotTitle?: string;
  title: string;
  pictures?: ClientPicture[];
  canEdit?: boolean;
  commands?: CommandMapPoint[];
  commandsLoading?: boolean;
  disabled?: boolean;
  autoFocusSearch?: boolean;
  onSetPosition?: () => void;
}

const MAIN_COLUMN = "lg:col-span-2 lg:col-start-1";
const STICKY_VIEW = "lg:max-h-[calc(100dvh-5.5rem)]";
const STICKY_FORM = "lg:max-h-[calc(100dvh-9.5rem)]";

export function ClientSections({
  mode,
  client,
  type,
  api,
  zones,
  depot,
  depotTitle,
  title,
  pictures,
  canEdit = false,
  commands,
  commandsLoading,
  disabled,
  autoFocusSearch,
  onSetPosition,
}: ClientSectionsProps) {
  const showPhotos =
    mode === "view" && (canEdit || (pictures?.length ?? 0) > 0);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <ClientIdentityCard
        mode={mode}
        client={client}
        type={type}
        api={api}
        zones={zones}
        disabled={disabled}
        className={MAIN_COLUMN}
      />
      <ClientAddressCard
        mode={mode}
        client={client}
        api={api}
        depot={depot}
        disabled={disabled}
        autoFocusSearch={autoFocusSearch}
        className={MAIN_COLUMN}
      />
      <div
        className={cn(
          "lg:col-start-3 lg:row-start-1",
          showPhotos ? "lg:row-span-7" : "lg:row-span-6"
        )}
      >
        <div className="lg:sticky lg:top-4 lg:flex lg:flex-col">
          <ClientPositionCard
            mode={mode}
            client={client}
            api={api}
            title={title}
            depot={depot}
            depotTitle={depotTitle}
            commands={commands}
            commandsLoading={commandsLoading}
            disabled={disabled}
            onSetPosition={onSetPosition}
            className={mode === "view" ? STICKY_VIEW : STICKY_FORM}
          />
        </div>
      </div>
      <ClientDeliveryCard
        mode={mode}
        client={client}
        type={type}
        api={api}
        disabled={disabled}
        className={MAIN_COLUMN}
      />
      <ClientContactCard
        mode={mode}
        client={client}
        api={api}
        disabled={disabled}
        className={MAIN_COLUMN}
      />
      <ClientBillingCard
        mode={mode}
        client={client}
        api={api}
        disabled={disabled}
        className={MAIN_COLUMN}
      />
      <ClientNoteCard
        mode={mode}
        client={client}
        api={api}
        disabled={disabled}
        className={MAIN_COLUMN}
      />
      {showPhotos && client && (
        <ClientPhotosCard
          clientId={client.id}
          pictures={pictures ?? []}
          canEdit={canEdit}
          className={MAIN_COLUMN}
        />
      )}
    </div>
  );
}
