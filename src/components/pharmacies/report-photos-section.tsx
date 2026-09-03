import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, Images } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ReportPictureGrid } from "@/components/pharmacies/report-picture-grid";
import { PharmacyPhotoGallery } from "@/components/pharmacies/pharmacy-photo-gallery";
import type { PharmacyDetail } from "@/features/pharmacies";
import type { PharmacyReport } from "@/features/pharmacy-reports";

interface ReportPhotosSectionProps {
  report: PharmacyReport;
  cip: string | null;
  pharmacy?: PharmacyDetail;
}

export function ReportPhotosSection({
  report,
  cip,
  pharmacy,
}: ReportPhotosSectionProps) {
  const { t } = useTranslation();
  const [galleryOpen, setGalleryOpen] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      {report.pictures.length > 0 ? (
        <ReportPictureGrid report={report} cip={cip} />
      ) : (
        <p className="text-sm text-muted-foreground">
          {t("pharmacies.reports.noReportPhotos")}
        </p>
      )}
      {pharmacy && (
        <div className="flex flex-col gap-3 border-t pt-3">
          <Button
            type="button"
            variant="outline"
            className="min-h-11 w-full justify-between lg:min-h-9"
            aria-expanded={galleryOpen}
            onClick={() => setGalleryOpen((prev) => !prev)}
          >
            <span className="flex min-w-0 items-center gap-2">
              <Images className="size-4 shrink-0" />
              <span className="truncate">
                {t("pharmacies.reports.gallerySection", {
                  count: pharmacy.pictures.length,
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
            <PharmacyPhotoGallery
              cip={pharmacy.cip}
              pictures={pharmacy.pictures}
            />
          )}
        </div>
      )}
    </div>
  );
}
