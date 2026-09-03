import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ImageOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/states";
import { formatDateTime } from "@/lib/date";
import { imageUrl } from "@/lib/images";

export interface GridPicture {
  id: string;
  name: string;
  createdAt?: string | null;
  imagePath: string;
}

interface PictureGridProps {
  pictures: GridPicture[];
  emptyMessage: string;
  hint?: string;
}

export function PictureGrid({
  pictures,
  emptyMessage,
  hint,
}: PictureGridProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? "en";
  const [selected, setSelected] = useState<GridPicture | null>(null);
  const [broken, setBroken] = useState<string[]>([]);

  if (pictures.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <EmptyState message={emptyMessage} icon={<ImageOff className="size-8" />} />
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {pictures.map((picture) => (
          <li key={picture.id}>
            <button
              type="button"
              onClick={() => setSelected(picture)}
              className="block w-full overflow-hidden rounded-lg border bg-muted transition-colors hover:border-primary/40"
              title={t("commands.detail.openPicture")}
              aria-label={t("commands.detail.openPicture")}
            >
              {broken.includes(picture.id) ? (
                <span className="flex aspect-square items-center justify-center text-muted-foreground">
                  <ImageOff className="size-6" />
                </span>
              ) : (
                <img
                  src={imageUrl(picture.imagePath)}
                  alt={picture.name}
                  loading="lazy"
                  className="aspect-square w-full object-cover"
                  onError={() =>
                    setBroken((prev) =>
                      prev.includes(picture.id) ? prev : [...prev, picture.id]
                    )
                  }
                />
              )}
            </button>
          </li>
        ))}
      </ul>

      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t("commands.detail.pictures")}</DialogTitle>
          </DialogHeader>
          {selected && (
            <img
              src={imageUrl(selected.imagePath)}
              alt={selected.name}
              className="max-h-[70dvh] w-full rounded-lg object-contain"
            />
          )}
          {selected?.createdAt && (
            <p className="text-xs text-muted-foreground">
              {formatDateTime(selected.createdAt, lang)}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
