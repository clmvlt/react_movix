import { PharmacyAddressCard } from "@/components/pharmacies/pharmacy-address-card";
import { PharmacyContactCard } from "@/components/pharmacies/pharmacy-contact-card";
import { PharmacyDeliveryCard } from "@/components/pharmacies/pharmacy-delivery-card";
import {
  PharmacyIdentityCard,
  type CipControl,
} from "@/components/pharmacies/pharmacy-identity-card";
import { PharmacyNoteCard } from "@/components/pharmacies/pharmacy-note-card";
import { PharmacyPositionCard } from "@/components/pharmacies/pharmacy-position-card";
import type { PharmacyFormApi } from "@/components/pharmacies/use-pharmacy-form";
import type { CommandMapPoint } from "@/components/pharmacies/pharmacy-utils";
import type { Pharmacy } from "@/features/pharmacies";
import type { Zone } from "@/features/zones";
import type { LngLat } from "@/components/map";

interface PharmacySectionsProps {
  mode: "view" | "edit" | "create";
  pharmacy: Pharmacy | null;
  api?: PharmacyFormApi;
  zones: Zone[];
  depot: LngLat | null;
  depotTitle?: string;
  title: string;
  commands: CommandMapPoint[];
  commandsLoading?: boolean;
  disabled?: boolean;
  cip?: CipControl;
  autoFocusSearch?: boolean;
  onSetPosition?: () => void;
}

const MAIN_COLUMN = "lg:col-span-2";
const STICKY_VIEW = "lg:h-[calc(100dvh-5.5rem)]";
const STICKY_FORM = "lg:h-[calc(100dvh-9.5rem)]";

export function PharmacySections({
  mode,
  pharmacy,
  api,
  zones,
  depot,
  depotTitle,
  title,
  commands,
  commandsLoading,
  disabled,
  cip,
  autoFocusSearch,
  onSetPosition,
}: PharmacySectionsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <PharmacyIdentityCard
        mode={mode}
        pharmacy={pharmacy}
        api={api}
        zones={zones}
        disabled={disabled}
        cip={cip}
        className={MAIN_COLUMN}
      />
      <PharmacyAddressCard
        mode={mode}
        pharmacy={pharmacy}
        api={api}
        depot={depot}
        disabled={disabled}
        autoFocusSearch={autoFocusSearch}
        className={MAIN_COLUMN}
      />
      <div className="lg:col-start-3 lg:row-span-5 lg:row-start-1">
        <div className="lg:sticky lg:top-4">
          <PharmacyPositionCard
            mode={mode}
            pharmacy={pharmacy}
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
      <PharmacyDeliveryCard
        mode={mode}
        pharmacy={pharmacy}
        api={api}
        disabled={disabled}
        className={MAIN_COLUMN}
      />
      <PharmacyContactCard
        mode={mode}
        pharmacy={pharmacy}
        api={api}
        disabled={disabled}
        className={MAIN_COLUMN}
      />
      <PharmacyNoteCard
        mode={mode}
        pharmacy={pharmacy}
        api={api}
        disabled={disabled}
        className={MAIN_COLUMN}
      />
    </div>
  );
}
