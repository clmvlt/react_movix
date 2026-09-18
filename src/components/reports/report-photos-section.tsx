import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, Images } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ReportPictureGrid } from "@/components/reports/report-picture-grid";
import { ClientPhotoGallery } from "@/components/clients/client-photo-gallery";
import type { Client } from "@/features/clients";
import type { ClientReport } from "@/features/client-reports";

interface ReportPhotosSectionProps {
  report: ClientReport;
  clientId: string | null;
  client?: Client;
  canEdit: boolean;
}

export function ReportPhotosSection({
  report,
  clientId,
  client,
  canEdit,
}: ReportPhotosSectionProps) {
  const { t } = useTranslation();
  const [galleryOpen, setGalleryOpen] = useState(false);
  const pictures = client?.pictures ?? [];

  return (
    <div className="flex flex-col gap-3">
      {report.pictures.length > 0 ? (
        <ReportPictureGrid
          report={report}
          clientId={canEdit ? clientId : null}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          {t("clientReports.noReportPhotos")}
        </p>
      )}
      {client && (
        <div className="flex flex-col gap-3 border-t pt-3">
          <Button
            type="button"
            variant="outline"
            className="min-h-11 w-full justify-between lg:min-h-9"
            aria-expanded={galleryOpen}
            onClick={() => setGalleryOpen((previous) => !previous)}
          >
            <span className="flex min-w-0 items-center gap-2">
              <Images className="size-4 shrink-0" />
              <span className="truncate">
                {t("clientReports.gallerySection", {
                  count: pictures.length,
                })}
              </span>
            </span>
            <ChevronDown
              className={cn(
                "size-4 shrink-0 transition-transform",
                galleryOpen && "rotate-180"
              )}
            />
          </Button>
          {galleryOpen && (
            <ClientPhotoGallery clientId={client.id} pictures={pictures} />
          )}
        </div>
      )}
    </div>
  );
}
