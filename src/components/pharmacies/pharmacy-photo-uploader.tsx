import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { useTranslation } from "react-i18next";
import { ImagePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { useToast } from "@/app/toast-context";
import {
  PICTURE_MAX_BYTES,
  dataUrlBytes,
  toUploadDataUrl,
  useUploadPharmacyPictures,
  type PictureUploadInput,
} from "@/features/pharmacies";

interface PharmacyPhotoUploaderProps {
  cip: string;
  nextDisplayOrder: number;
}

export function PharmacyPhotoUploader({
  cip,
  nextDisplayOrder,
}: PharmacyPhotoUploaderProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadPharmacyPictures();

  const [dragging, setDragging] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [rejected, setRejected] = useState<string[]>([]);

  const busy = preparing || upload.isPending;

  const handleFiles = async (files: File[]) => {
    if (files.length === 0) return;
    setRejected([]);

    const skipped: string[] = [];
    const items: PictureUploadInput[] = [];

    setPreparing(true);
    try {
      for (const file of files) {
        if (!file.type.startsWith("image/")) {
          skipped.push(t("pharmacies.photos.notAnImage", { name: file.name }));
          continue;
        }
        if (file.size > PICTURE_MAX_BYTES) {
          skipped.push(t("pharmacies.photos.tooLarge", { name: file.name }));
          continue;
        }
        const base64 = await toUploadDataUrl(file);
        if (dataUrlBytes(base64) > PICTURE_MAX_BYTES) {
          skipped.push(t("pharmacies.photos.tooLarge", { name: file.name }));
          continue;
        }
        items.push({
          base64,
          name: file.name,
          displayOrder: nextDisplayOrder + items.length,
        });
      }
    } finally {
      setPreparing(false);
    }

    setRejected(skipped);
    if (items.length === 0) return;

    setProgress({ current: 0, total: items.length });
    const outcome = await upload.mutateAsync({
      cip,
      items,
      onProgress: (done) =>
        setProgress({ current: Math.min(done + 1, items.length), total: items.length }),
    });
    setProgress({ current: 0, total: 0 });
    if (outcome.failed > 0) {
      toast.error(t("pharmacies.photos.errors.upload", { count: outcome.failed }));
    }
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    void handleFiles(files);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    void handleFiles(Array.from(event.dataTransfer.files ?? []));
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
          setDragging(true);
        }}
        onDragLeave={(event) => {
          if (event.currentTarget.contains(event.relatedTarget as Node)) return;
          setDragging(false);
        }}
        onDrop={handleDrop}
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-6 text-center",
          dragging && "border-primary bg-accent"
        )}
      >
        <ImagePlus className="size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {t("pharmacies.photos.dropHint")}
        </p>
        <Button
          type="button"
          variant="outline"
          className="min-h-11 lg:min-h-10"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy && <Loader2 className="animate-spin" />}
          {t("pharmacies.photos.add")}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleInputChange}
        />
      </div>

      {progress.total > 0 && (
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {t("pharmacies.photos.uploading", {
            current: progress.current,
            total: progress.total,
          })}
        </p>
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
