import { useMemo, useState, type DragEvent } from "react";
import { useTranslation } from "react-i18next";
import {
  ChevronLeft,
  ChevronRight,
  ImageOff,
  Loader2,
  Maximize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/states";
import { ClientPhotoUploader } from "./client-photo-uploader";
import { ClientPhotoLightbox } from "./client-photo-lightbox";
import { imageUrl } from "@/lib/images";
import { cn } from "@/lib/utils";
import { useToast } from "@/app/toast-context";
import {
  sortPictures,
  useDeleteClientPicture,
  useReorderClientPictures,
  type ClientPicture,
} from "@/features/clients";

interface ClientPhotoGalleryProps {
  clientId: string;
  pictures: ClientPicture[];
}

export function ClientPhotoGallery({
  clientId,
  pictures,
}: ClientPhotoGalleryProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const reorder = useReorderClientPictures();
  const removePicture = useDeleteClientPicture();

  const sorted = useMemo(() => sortPictures(pictures), [pictures]);
  const signature = sorted.map((picture) => picture.id).join(",");

  const [baseSignature, setBaseSignature] = useState(signature);
  const [localIds, setLocalIds] = useState<string[] | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ClientPicture | null>(null);
  const [broken, setBroken] = useState<string[]>([]);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  if (signature !== baseSignature) {
    setBaseSignature(signature);
    setLocalIds(null);
  }

  const ordered = useMemo(() => {
    if (!localIds) return sorted;
    const byId = new Map(sorted.map((picture) => [picture.id, picture]));
    return localIds
      .map((id) => byId.get(id))
      .filter((picture): picture is ClientPicture => Boolean(picture));
  }, [localIds, sorted]);

  const dirty = localIds !== null;
  const nextDisplayOrder = sorted.reduce(
    (max, picture) => Math.max(max, (picture.displayOrder ?? 0) + 1),
    0
  );

  const move = (from: number, to: number) => {
    if (to < 0 || to >= ordered.length || from === to) return;
    const ids = ordered.map((picture) => picture.id);
    const [moved] = ids.splice(from, 1);
    ids.splice(to, 0, moved);
    setLocalIds(ids);
  };

  const handleDrop = (event: DragEvent<HTMLElement>, target: number) => {
    event.preventDefault();
    if (!draggedId) return;
    const from = ordered.findIndex((picture) => picture.id === draggedId);
    setDraggedId(null);
    if (from < 0) return;
    move(from, target);
  };

  const handleSaveOrder = () => {
    reorder.mutate(
      { id: clientId, pictureIds: ordered.map((picture) => picture.id) },
      {
        onSuccess: () => setLocalIds(null),
        onError: () => toast.error(t("clients.photos.errors.order")),
      }
    );
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    removePicture.mutate(
      { id: clientId, pictureId: deleteTarget.id },
      {
        onSuccess: () => {
          setDeleteTarget(null);
          setLightboxIndex(null);
        },
        onError: () => toast.error(t("clients.photos.errors.delete")),
      }
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <ClientPhotoUploader clientId={clientId} nextDisplayOrder={nextDisplayOrder} />

      {dirty && (
        <div className="flex flex-col gap-2 rounded-xl border p-3 sm:flex-row sm:items-center">
          <p className="min-w-0 flex-1 text-sm text-muted-foreground">
            {t("clients.photos.orderChanged")}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="min-h-11 flex-1 sm:min-h-10 sm:flex-none"
              onClick={() => setLocalIds(null)}
              disabled={reorder.isPending}
            >
              {t("clients.photos.cancelOrder")}
            </Button>
            <Button
              type="button"
              className="min-h-11 flex-1 sm:min-h-10 sm:flex-none"
              onClick={handleSaveOrder}
              disabled={reorder.isPending}
            >
              {reorder.isPending && <Loader2 className="animate-spin" />}
              {t("clients.photos.saveOrder")}
            </Button>
          </div>
        </div>
      )}

      {ordered.length === 0 ? (
        <EmptyState message={t("clients.photos.empty")} />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {ordered.map((picture, position) => {
            const isBroken = broken.includes(picture.id);
            return (
              <li
                key={picture.id}
                draggable
                onDragStart={(event) => {
                  setDraggedId(picture.id);
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", picture.id);
                }}
                onDragEnd={() => setDraggedId(null)}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                }}
                onDrop={(event) => handleDrop(event, position)}
                className={cn(
                  "flex flex-col overflow-hidden rounded-xl border bg-card",
                  draggedId === picture.id && "opacity-50"
                )}
              >
                <button
                  type="button"
                  onClick={() => setLightboxIndex(position)}
                  aria-label={
                    picture.originalName ?? t("clients.photos.openLightbox")
                  }
                  className="flex aspect-square items-center justify-center overflow-hidden bg-muted"
                >
                  {isBroken ? (
                    <span className="flex flex-col items-center gap-1 p-2 text-center text-muted-foreground">
                      <ImageOff className="size-6" />
                      <span className="text-xs">
                        {t("clients.photos.broken")}
                      </span>
                    </span>
                  ) : (
                    <img
                      src={imageUrl(picture.imagePath)}
                      alt={picture.originalName ?? picture.id}
                      loading="lazy"
                      onError={() =>
                        setBroken((prev) =>
                          prev.includes(picture.id)
                            ? prev
                            : [...prev, picture.id]
                        )
                      }
                      className="size-full object-cover"
                    />
                  )}
                </button>

                <div className="flex items-center justify-between gap-1 border-t p-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-11 shrink-0 lg:size-8"
                    onClick={() => move(position, position - 1)}
                    disabled={position === 0}
                    title={t("clients.photos.moveUp")}
                    aria-label={t("clients.photos.moveUp")}
                  >
                    <ChevronLeft className="size-5 lg:size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-11 shrink-0 lg:size-8"
                    onClick={() => setLightboxIndex(position)}
                    title={t("clients.photos.fullscreen")}
                    aria-label={t("clients.photos.fullscreen")}
                  >
                    <Maximize2 className="size-5 lg:size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-11 shrink-0 lg:size-8"
                    onClick={() => move(position, position + 1)}
                    disabled={position === ordered.length - 1}
                    title={t("clients.photos.moveDown")}
                    aria-label={t("clients.photos.moveDown")}
                  >
                    <ChevronRight className="size-5 lg:size-4" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ClientPhotoLightbox
        clientId={clientId}
        pictures={ordered}
        index={lightboxIndex}
        onIndexChange={setLightboxIndex}
        onDelete={setDeleteTarget}
      />

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("clients.photos.deleteTitle")}</DialogTitle>
            <DialogDescription>
              {t("clients.photos.deleteConfirm")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 sm:min-h-10"
              onClick={() => setDeleteTarget(null)}
              disabled={removePicture.isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="min-h-11 sm:min-h-10"
              onClick={handleDelete}
              disabled={removePicture.isPending}
            >
              {removePicture.isPending && <Loader2 className="animate-spin" />}
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
