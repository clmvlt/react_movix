import { useTranslation } from "react-i18next";
import { Images } from "lucide-react";
import { PictureGrid } from "@/components/picture-grid";
import { sortPictures, type ClientPicture } from "@/features/clients";
import { ClientPhotoGallery } from "./client-photo-gallery";
import { SectionCard } from "./client-fields";

interface ClientPhotosCardProps {
  clientId: string;
  pictures: ClientPicture[];
  canEdit: boolean;
  className?: string;
}

export function ClientPhotosCard({
  clientId,
  pictures,
  canEdit,
  className,
}: ClientPhotosCardProps) {
  const { t } = useTranslation();
  const sorted = sortPictures(pictures);

  return (
    <SectionCard
      title={t("clients.sections.photos", { count: sorted.length })}
      icon={Images}
      className={className}
    >
      {canEdit ? (
        <ClientPhotoGallery clientId={clientId} pictures={sorted} />
      ) : (
        <PictureGrid pictures={sorted} emptyMessage={t("clients.info.noPhotos")} />
      )}
    </SectionCard>
  );
}
