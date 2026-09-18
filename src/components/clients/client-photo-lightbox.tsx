import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import {
  ChevronLeft,
  ChevronRight,
  ImageOff,
  Loader2,
  Pen,
  RefreshCw,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ClientPhotoEditor } from "./client-photo-editor";
import { imageUrl } from "@/lib/images";
import { useToast } from "@/app/toast-context";
import {
  PICTURE_MAX_BYTES,
  dataUrlBytes,
  toUploadDataUrl,
  useUpdateClientPicture,
  type ClientPicture,
} from "@/features/clients";

interface ClientPhotoLightboxProps {
  clientId: string;
  pictures: ClientPicture[];
  index: number | null;
  onIndexChange: (index: number | null) => void;
  onDelete: (picture: ClientPicture) => void;
}

export function ClientPhotoLightbox({
  clientId,
  pictures,
  index,
  onIndexChange,
  onDelete,
}: ClientPhotoLightboxProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const updatePicture = useUpdateClientPicture();

  const [broken, setBroken] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [editing, setEditing] = useState(false);

  const picture = index != null ? pictures[index] : undefined;

  useEffect(() => {
    setBroken(false);
  }, [picture?.id]);

  if (!picture) return null;

  const busy = preparing || updatePicture.isPending;

  const go = (delta: number) => {
    if (index == null) return;
    const next = index + delta;
    if (next < 0 || next >= pictures.length) return;
    onIndexChange(next);
  };

  const handleReplace = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/") || file.size > PICTURE_MAX_BYTES) {
      toast.error(t("clients.photos.tooLarge", { name: file.name }));
      return;
    }

    setPreparing(true);
    let base64: string;
    try {
      base64 = await toUploadDataUrl(file);
    } finally {
      setPreparing(false);
    }

    if (dataUrlBytes(base64) > PICTURE_MAX_BYTES) {
      toast.error(t("clients.photos.tooLarge", { name: file.name }));
      return;
    }

    updatePicture.mutate(
      { id: clientId, pictureId: picture.id, input: { base64 } },
      {
        onSuccess: () => setBroken(false),
        onError: () => toast.error(t("clients.photos.errors.replace")),
      }
    );
  };

  return (
    <>
      <Dialog
        open={index != null && !editing}
        onOpenChange={(open) => !open && onIndexChange(null)}
      >
        <DialogContent
          className="flex h-[calc(100dvh-2rem)] max-w-[calc(100%-1rem)] flex-col sm:max-w-6xl"
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") go(-1);
            if (event.key === "ArrowRight") go(1);
          }}
        >
          <DialogHeader>
            <DialogTitle>{t("clients.photos.title")}</DialogTitle>
            <DialogDescription>
              {index != null ? `${index + 1} / ${pictures.length}` : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="flex min-h-0 flex-1 items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-11 shrink-0 lg:size-10"
              onClick={() => go(-1)}
              disabled={index === 0}
              title={t("clients.photos.previous")}
              aria-label={t("clients.photos.previous")}
            >
              <ChevronLeft />
            </Button>

            <div className="flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden rounded-xl border bg-neutral-900 p-2 sm:p-4">
              {broken ? (
                <div className="flex flex-col items-center gap-2 p-6 text-center text-neutral-200">
                  <ImageOff className="size-8" />
                  <p className="text-sm">{t("clients.photos.broken")}</p>
                  <p className="text-xs text-neutral-400">
                    {t("clients.photos.brokenHint")}
                  </p>
                </div>
              ) : (
                <img
                  src={imageUrl(picture.imagePath)}
                  alt={picture.originalName ?? picture.id}
                  onError={() => setBroken(true)}
                  className="max-h-full max-w-full rounded-md object-contain shadow-lg"
                />
              )}
            </div>

            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-11 shrink-0 lg:size-10"
              onClick={() => go(1)}
              disabled={index === pictures.length - 1}
              title={t("clients.photos.next")}
              aria-label={t("clients.photos.next")}
            >
              <ChevronRight />
            </Button>
          </div>

          <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              onClick={() => setEditing(true)}
              disabled={busy || broken}
              className="min-h-11 lg:min-h-10"
            >
              <Pen />
              {t("clients.photos.annotate")}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 lg:min-h-10"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
            >
              {busy ? <Loader2 className="animate-spin" /> : <RefreshCw />}
              {t("clients.photos.replace")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="min-h-11 lg:min-h-10"
              onClick={() => onDelete(picture)}
              disabled={busy}
            >
              <Trash2 />
              {t("clients.photos.delete")}
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => void handleReplace(event)}
            />
          </div>
        </DialogContent>
      </Dialog>

      <ClientPhotoEditor
        clientId={clientId}
        picture={picture}
        open={editing}
        onOpenChange={setEditing}
        onSaved={() => setBroken(false)}
      />
    </>
  );
}
