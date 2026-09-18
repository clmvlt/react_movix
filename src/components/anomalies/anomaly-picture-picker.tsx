import { useRef, useState, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { ImagePlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  PICTURE_MAX_BYTES,
  dataUrlBytes,
  toUploadDataUrl,
} from "@/features/clients";
import { ANOMALY_PICTURE_MAX } from "@/features/anomalies";

export interface PendingPicture {
  key: string;
  name: string;
  dataUrl: string;
}

interface AnomalyPicturePickerProps {
  value: PendingPicture[];
  onChange: (pictures: PendingPicture[]) => void;
  disabled?: boolean;
}

export function AnomalyPicturePicker({
  value,
  onChange,
  disabled = false,
}: AnomalyPicturePickerProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preparing, setPreparing] = useState(false);
  const [rejected, setRejected] = useState<string[]>([]);

  const remaining = ANOMALY_PICTURE_MAX - value.length;

  const handleFiles = async (files: File[]) => {
    if (files.length === 0) return;
    const skipped: string[] = [];
    const added: PendingPicture[] = [];

    setPreparing(true);
    try {
      for (const file of files) {
        if (added.length >= remaining) {
          skipped.push(
            t("anomalies.form.tooManyPictures", { count: ANOMALY_PICTURE_MAX })
          );
          break;
        }
        if (!file.type.startsWith("image/")) {
          skipped.push(t("clients.photos.notAnImage", { name: file.name }));
          continue;
        }
        if (file.size > PICTURE_MAX_BYTES) {
          skipped.push(t("clients.photos.tooLarge", { name: file.name }));
          continue;
        }
        const dataUrl = await toUploadDataUrl(file);
        if (dataUrlBytes(dataUrl) > PICTURE_MAX_BYTES) {
          skipped.push(t("clients.photos.tooLarge", { name: file.name }));
          continue;
        }
        added.push({
          key: `${file.name}-${added.length}-${file.lastModified}`,
          name: file.name,
          dataUrl,
        });
      }
    } finally {
      setPreparing(false);
    }

    setRejected(skipped);
    if (added.length > 0) onChange([...value, ...added]);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    void handleFiles(files);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          className="min-h-11 lg:min-h-10"
          disabled={disabled || preparing || remaining <= 0}
          onClick={() => inputRef.current?.click()}
        >
          {preparing ? (
            <Loader2 className="animate-spin" />
          ) : (
            <ImagePlus className="size-4" />
          )}
          {t("anomalies.form.addPictures")}
        </Button>
        <span className="text-xs text-muted-foreground">
          {t("anomalies.form.pictureCount", {
            count: value.length,
            max: ANOMALY_PICTURE_MAX,
          })}
        </span>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleInputChange}
        />
      </div>

      {value.length > 0 && (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {value.map((picture) => (
            <li key={picture.key} className="relative">
              <img
                src={picture.dataUrl}
                alt={picture.name}
                className="aspect-square w-full rounded-lg border object-cover"
              />
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute right-1 top-1 size-8"
                disabled={disabled}
                onClick={() =>
                  onChange(value.filter((item) => item.key !== picture.key))
                }
                title={t("anomalies.form.removePicture")}
                aria-label={t("anomalies.form.removePicture")}
              >
                <X className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {rejected.length > 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            <ul className="flex flex-col gap-1">
              {rejected.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
