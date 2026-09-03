import { useTranslation } from "react-i18next";
import { FileText, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useObjectUrl } from "@/lib/use-object-url";
import { cn } from "@/lib/utils";
import type { LabelOrientation } from "@/features/label-settings";

interface LabelPreviewProps {
  orientation: LabelOrientation;
  blob: Blob | null | undefined;
  loading: boolean;
  error: string | null;
  onTestPdf: () => void;
}

export function LabelPreview({
  orientation,
  blob,
  loading,
  error,
  onTestPdf,
}: LabelPreviewProps) {
  const { t } = useTranslation();
  const url = useObjectUrl(blob ?? null);
  const landscape = orientation === "LANDSCAPE";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {t("labelSettings.preview.title")}
        </CardTitle>
        <CardDescription>
          {t("labelSettings.preview.subtitle")}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex justify-center rounded-lg border border-border bg-muted p-3">
          <div className="relative flex max-w-full items-center justify-center">
            {url ? (
              <img
                src={url}
                alt={t("labelSettings.preview.alt")}
                className={cn(
                  "max-h-[45dvh] max-w-full object-contain transition-opacity xl:max-h-[520px]",
                  loading && "opacity-50"
                )}
              />
            ) : (
              <div
                aria-hidden
                className={cn(
                  "w-full rounded-sm bg-background",
                  landscape
                    ? "aspect-[421/295] max-w-[421px]"
                    : "aspect-[295/421] max-w-[295px]"
                )}
              />
            )}
            {loading && (
              <span className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </span>
            )}
          </div>
        </div>

        <p
          className="min-h-4 text-center text-xs leading-4 text-muted-foreground"
          aria-live="polite"
        >
          {loading ? t("labelSettings.preview.refreshing") : ""}
        </p>

        {error && (
          <Alert variant="warning">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button
          type="button"
          variant="outline"
          className="min-h-11 w-full lg:min-h-10"
          onClick={onTestPdf}
        >
          <FileText />
          {t("labelSettings.preview.testPdf")}
        </Button>
      </CardContent>
    </Card>
  );
}
