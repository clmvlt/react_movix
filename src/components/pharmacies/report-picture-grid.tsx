import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, ImageOff, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { imageUrl } from "@/lib/images";
import { useToast } from "@/app/toast-context";
import { useTransferReportPicture } from "@/features/pharmacies";
import type { PharmacyReport } from "@/features/pharmacy-reports";

interface ReportPictureGridProps {
  report: PharmacyReport;
  cip: string | null;
}

export function ReportPictureGrid({ report, cip }: ReportPictureGridProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const transferPicture = useTransferReportPicture();

  const [transferringId, setTransferringId] = useState<string | null>(null);
  const [transferredIds, setTransferredIds] = useState<string[]>([]);
  const [broken, setBroken] = useState<string[]>([]);

  if (report.pictures.length === 0) return null;

  const handleTransfer = (pictureId: string) => {
    if (!cip) return;
    setTransferringId(pictureId);
    transferPicture.mutate(
      { cip, pictureId },
      {
        onSuccess: () =>
          setTransferredIds((prev) =>
            prev.includes(pictureId) ? prev : [...prev, pictureId]
          ),
        onError: () => toast.error(t("pharmacies.reports.transferFailed")),
        onSettled: () => setTransferringId(null),
      }
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-5">
        {report.pictures.map((picture) => {
          const isBroken = broken.includes(picture.id);
          const isTransferred = transferredIds.includes(picture.id);
          const label = isTransferred
            ? t("pharmacies.reports.photoAdded")
            : t("pharmacies.reports.transfer");
          return (
            <li
              key={picture.id}
              className="flex flex-col overflow-hidden rounded-lg border"
            >
              <div className="flex aspect-square items-center justify-center bg-muted">
                {isBroken ? (
                  <ImageOff className="size-6 text-muted-foreground" />
                ) : (
                  <img
                    src={imageUrl(picture.imagePath)}
                    alt={picture.name}
                    loading="lazy"
                    onError={() =>
                      setBroken((prev) =>
                        prev.includes(picture.id) ? prev : [...prev, picture.id]
                      )
                    }
                    className="size-full object-cover"
                  />
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="min-h-11 rounded-none border-t lg:min-h-9"
                disabled={
                  !cip || isTransferred || transferringId === picture.id
                }
                onClick={() => handleTransfer(picture.id)}
                title={label}
                aria-label={label}
              >
                {transferringId === picture.id ? (
                  <Loader2 className="animate-spin" />
                ) : isTransferred ? (
                  <Check />
                ) : (
                  <Upload />
                )}
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
