import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useTranslation } from "react-i18next";
import { Check, Loader2, Pen, RotateCcw, Trash2, Type } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { useToast } from "@/app/toast-context";
import { categoryPalette, contrastTextOn, neutral } from "@/lib/colors";
import {
  PICTURE_MAX_BYTES,
  PICTURE_MAX_EDGE,
  PICTURE_QUALITY,
  dataUrlBytes,
  pharmaciesApi,
  useUpdatePharmacyPicture,
  type PharmacyPicture,
} from "@/features/pharmacies";

type Point = [number, number];

type Annotation =
  | { kind: "stroke"; color: string; width: number; points: Point[] }
  | {
      kind: "text";
      color: string;
      size: number;
      x: number;
      y: number;
      value: string;
    };

type Tool = "pen" | "text";

interface CanvasSize {
  width: number;
  height: number;
}

const COLORS = [neutral[900], neutral.white, ...categoryPalette.slice(0, 4)];
const WIDTHS = [4, 10, 20] as const;
const WIDTH_LABELS = [
  "pharmacies.photos.editor.widthSmall",
  "pharmacies.photos.editor.widthMedium",
  "pharmacies.photos.editor.widthLarge",
];

interface PharmacyPhotoEditorProps {
  cip: string;
  picture: PharmacyPicture | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function PharmacyPhotoEditor({
  cip,
  picture,
  open,
  onOpenChange,
  onSaved,
}: PharmacyPhotoEditorProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const updatePicture = useUpdatePharmacyPicture();

  const [loading, setLoading] = useState(false);
  const [size, setSize] = useState<CanvasSize | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [drawing, setDrawing] = useState<Annotation | null>(null);
  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState<string>(COLORS[0]);
  const [width, setWidth] = useState<number>(WIDTHS[1]);
  const [text, setText] = useState("");

  const pictureId = picture?.id ?? null;
  const imagePath = picture?.imagePath ?? null;
  const mimeType =
    picture?.mimeType === "image/png" ? "image/png" : "image/jpeg";

  useEffect(() => {
    if (!open || !imagePath) return;

    let cancelled = false;
    let objectUrl: string | null = null;

    setLoading(true);
    setSize(null);
    setError(null);
    setAnnotations([]);
    setDrawing(null);
    setText("");

    void (async () => {
      try {
        const blob = await pharmaciesApi.pictureBlob(imagePath);
        objectUrl = URL.createObjectURL(blob);
        const image = new Image();
        image.src = objectUrl;
        await image.decode();
        if (cancelled) return;

        const scale = Math.min(
          1,
          PICTURE_MAX_EDGE / Math.max(image.naturalWidth, image.naturalHeight)
        );
        imageRef.current = image;
        setSize({
          width: Math.max(1, Math.round(image.naturalWidth * scale)),
          height: Math.max(1, Math.round(image.naturalHeight * scale)),
        });
      } catch {
        if (!cancelled) setError(t("pharmacies.photos.editor.errors.load"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      imageRef.current = null;
    };
  }, [open, imagePath, pictureId, t]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    context.lineCap = "round";
    context.lineJoin = "round";

    const items = drawing ? [...annotations, drawing] : annotations;
    for (const item of items) {
      if (item.kind === "stroke") {
        if (item.points.length === 0) continue;
        context.strokeStyle = item.color;
        context.lineWidth = item.width;
        context.beginPath();
        context.moveTo(item.points[0][0], item.points[0][1]);
        for (const [x, y] of item.points.slice(1)) context.lineTo(x, y);
        if (item.points.length === 1) {
          context.lineTo(item.points[0][0] + 0.1, item.points[0][1]);
        }
        context.stroke();
      } else {
        context.fillStyle = item.color;
        context.font = `700 ${item.size}px sans-serif`;
        context.textBaseline = "middle";
        context.strokeStyle = contrastTextOn(item.color);
        context.lineWidth = Math.max(2, item.size / 12);
        context.strokeText(item.value, item.x, item.y);
        context.fillText(item.value, item.x, item.y);
      }
    }
  }, [annotations, drawing]);

  useEffect(() => {
    if (size) redraw();
  }, [size, redraw]);

  const toCanvasPoint = (event: ReactPointerEvent<HTMLCanvasElement>): Point => {
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    return [
      ((event.clientX - rect.left) / rect.width) * canvas.width,
      ((event.clientY - rect.top) / rect.height) * canvas.height,
    ];
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!size) return;
    const point = toCanvasPoint(event);

    if (tool === "text") {
      const value = text.trim();
      if (!value) return;
      setAnnotations((prev) => [
        ...prev,
        {
          kind: "text",
          color,
          size: Math.max(16, Math.round(size.width / 22)),
          x: point[0],
          y: point[1],
          value,
        },
      ]);
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    setDrawing({ kind: "stroke", color, width, points: [point] });
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawing || drawing.kind !== "stroke") return;
    const point = toCanvasPoint(event);
    setDrawing({ ...drawing, points: [...drawing.points, point] });
  };

  const handlePointerUp = () => {
    if (!drawing) return;
    setAnnotations((prev) => [...prev, drawing]);
    setDrawing(null);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || !picture) return;

    let base64: string;
    try {
      base64 = canvas.toDataURL(mimeType, PICTURE_QUALITY);
    } catch {
      toast.error(t("pharmacies.photos.editor.errors.save"));
      return;
    }

    if (dataUrlBytes(base64) > PICTURE_MAX_BYTES) {
      toast.error(t("pharmacies.photos.editor.errors.tooLarge"));
      return;
    }

    updatePicture.mutate(
      { cip, id: picture.id, input: { base64 } },
      {
        onSuccess: () => {
          onOpenChange(false);
          onSaved();
        },
        onError: () => toast.error(t("pharmacies.photos.editor.errors.save")),
      }
    );
  };

  const canSave = Boolean(size) && annotations.length > 0 && !updatePicture.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[calc(100dvh-2rem)] max-w-[calc(100%-1rem)] flex-col gap-3 sm:max-w-5xl">
        <DialogHeader className="shrink-0">
          <DialogTitle>{t("pharmacies.photos.editor.title")}</DialogTitle>
          <DialogDescription>
            {t("pharmacies.photos.editor.subtitle")}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="shrink-0">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <div className="flex shrink-0 gap-1 rounded-lg border bg-card p-1">
            <Button
              type="button"
              variant={tool === "pen" ? "default" : "ghost"}
              onClick={() => setTool("pen")}
              aria-pressed={tool === "pen"}
              className="min-h-10 px-3"
            >
              <Pen />
              {t("pharmacies.photos.editor.pen")}
            </Button>
            <Button
              type="button"
              variant={tool === "text" ? "default" : "ghost"}
              onClick={() => setTool("text")}
              aria-pressed={tool === "text"}
              className="min-h-10 px-3"
            >
              <Type />
              {t("pharmacies.photos.editor.text")}
            </Button>
          </div>

          <div
            role="group"
            aria-label={t("pharmacies.photos.editor.color")}
            className="flex shrink-0 items-center gap-1 rounded-lg border bg-card p-1"
          >
            {COLORS.map((entry) => {
              const active = entry === color;
              return (
                <button
                  key={entry}
                  type="button"
                  onClick={() => setColor(entry)}
                  aria-label={t("pharmacies.photos.editor.color")}
                  aria-pressed={active}
                  style={{ backgroundColor: entry }}
                  className={cn(
                    "flex size-9 items-center justify-center rounded-full border border-border transition-transform",
                    active && "ring-2 ring-ring ring-offset-2 ring-offset-card"
                  )}
                >
                  {active && (
                    <Check
                      className="size-4"
                      style={{ color: contrastTextOn(entry) }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {tool === "pen" && (
            <div
              role="group"
              aria-label={t("pharmacies.photos.editor.width")}
              className="flex shrink-0 gap-1 rounded-lg border bg-card p-1"
            >
              {WIDTHS.map((entry, index) => (
                <Button
                  key={entry}
                  type="button"
                  variant={entry === width ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setWidth(entry)}
                  aria-pressed={entry === width}
                  aria-label={t(WIDTH_LABELS[index])}
                  title={t(WIDTH_LABELS[index])}
                  className="size-10"
                >
                  <span
                    aria-hidden
                    className="rounded-full bg-current"
                    style={{
                      width: Math.min(entry, 14),
                      height: Math.min(entry, 14),
                    }}
                  />
                </Button>
              ))}
            </div>
          )}

          <div className="flex shrink-0 gap-1 sm:ml-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAnnotations((prev) => prev.slice(0, -1))}
              disabled={annotations.length === 0}
              title={t("pharmacies.photos.editor.undo")}
              aria-label={t("pharmacies.photos.editor.undo")}
              className="min-h-10"
            >
              <RotateCcw />
              <span className="hidden lg:inline">
                {t("pharmacies.photos.editor.undo")}
              </span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAnnotations([])}
              disabled={annotations.length === 0}
              title={t("pharmacies.photos.editor.clear")}
              aria-label={t("pharmacies.photos.editor.clear")}
              className="min-h-10"
            >
              <Trash2 />
              <span className="hidden lg:inline">
                {t("pharmacies.photos.editor.clear")}
              </span>
            </Button>
          </div>
        </div>

        {tool === "text" && (
          <div className="flex shrink-0 flex-col gap-1.5">
            <Input
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={t("pharmacies.photos.editor.textPlaceholder")}
              aria-label={t("pharmacies.photos.editor.textPlaceholder")}
              className="min-h-11 lg:min-h-10"
            />
            <p className="text-xs text-muted-foreground">
              {t("pharmacies.photos.editor.textHint")}
            </p>
          </div>
        )}

        <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-xl border bg-neutral-900 p-2 sm:p-4">
          {size ? (
            <canvas
              ref={canvasRef}
              width={size.width}
              height={size.height}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className={cn(
                "max-h-full max-w-full touch-none rounded-md shadow-lg",
                tool === "pen" ? "cursor-crosshair" : "cursor-text"
              )}
            />
          ) : (
            <span className="flex items-center gap-2 p-6 text-sm text-neutral-200">
              {loading && <Loader2 className="size-4 animate-spin" />}
              {loading ? t("pharmacies.photos.editor.loading") : ""}
            </span>
          )}
        </div>

        <DialogFooter className="shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updatePicture.isPending}
            className="min-h-11 sm:min-h-10"
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="min-h-11 sm:min-h-10"
          >
            {updatePicture.isPending && <Loader2 className="animate-spin" />}
            {t("pharmacies.photos.editor.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
