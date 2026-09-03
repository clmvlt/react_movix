import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Download, Loader2, Maximize2, Minimize2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingState } from "@/components/states";
import { useToast } from "@/app/toast-context";
import { useObjectUrl } from "@/lib/use-object-url";
import { downloadBlob } from "@/lib/download";
import { cn } from "@/lib/utils";

export interface PdfPreviewRequest {
  key: readonly unknown[];
  title: string;
  subtitle?: string;
  filename: string;
  load: () => Promise<Blob>;
  describeError?: (error: unknown) => string;
}

interface PdfPreviewDialogProps {
  request: PdfPreviewRequest | null;
  onOpenChange: (open: boolean) => void;
}

export function PdfPreviewDialog({
  request,
  onOpenChange,
}: PdfPreviewDialogProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const [fullscreen, setFullscreen] = useState(false);

  const pdfQuery = useQuery({
    queryKey: ["pdf-preview", ...(request?.key ?? [])],
    queryFn: () => (request as PdfPreviewRequest).load(),
    enabled: Boolean(request),
    retry: false,
    staleTime: Infinity,
    gcTime: 0,
  });
  const objectUrl = useObjectUrl(pdfQuery.data);

  const describeError = (error: unknown) =>
    request?.describeError?.(error) ?? t("common.pdfPreviewFailed");

  const handleDownload = () => {
    if (!request || !pdfQuery.data) return;
    try {
      downloadBlob(pdfQuery.data, request.filename);
    } catch (error) {
      toast.error(describeError(error));
    }
  };

  return (
    <Dialog
      open={Boolean(request)}
      onOpenChange={(open) => {
        if (!open) setFullscreen(false);
        onOpenChange(open);
      }}
    >
      <DialogContent
        className={cn(
          "max-w-3xl",
          fullscreen &&
            "flex h-dvh max-h-dvh w-screen max-w-none flex-col rounded-none border-0"
        )}
      >
        <DialogHeader>
          <DialogTitle>{request?.title ?? ""}</DialogTitle>
          <DialogDescription>{request?.subtitle ?? ""}</DialogDescription>
        </DialogHeader>

        <button
          type="button"
          className="absolute right-14 top-2 flex size-10 items-center justify-center rounded-md opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 sm:right-12 sm:top-3 sm:size-8"
          aria-label={
            fullscreen ? t("common.exitFullscreen") : t("common.fullscreen")
          }
          title={
            fullscreen ? t("common.exitFullscreen") : t("common.fullscreen")
          }
          onClick={() => setFullscreen((value) => !value)}
        >
          {fullscreen ? (
            <Minimize2 className="size-4" />
          ) : (
            <Maximize2 className="size-4" />
          )}
        </button>

        <div
          className={cn(
            "flex min-h-0 flex-col gap-4",
            fullscreen && "flex-1"
          )}
        >
          {pdfQuery.isLoading && <LoadingState />}

          {pdfQuery.isError && (
            <Alert variant="warning">
              <AlertDescription>
                {describeError(pdfQuery.error)}
              </AlertDescription>
            </Alert>
          )}

          {objectUrl && (
            <iframe
              src={objectUrl}
              title={request?.title ?? ""}
              className={cn(
                "w-full rounded-xl border border-border bg-muted",
                fullscreen ? "min-h-0 flex-1" : "h-[60vh]"
              )}
            />
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="min-h-11 sm:min-h-10"
            onClick={() => onOpenChange(false)}
          >
            {t("common.close")}
          </Button>
          <Button
            type="button"
            className="min-h-11 sm:min-h-10"
            disabled={!pdfQuery.data}
            onClick={handleDownload}
          >
            {pdfQuery.isLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            {t("common.download")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
