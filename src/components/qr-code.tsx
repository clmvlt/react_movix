import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { QrCode as QrCodeIcon } from "lucide-react";
import { buildQrMatrix, QR_QUIET_ZONE } from "@/lib/qr";
import { neutral } from "@/lib/colors";
import { cn } from "@/lib/utils";

interface QrCodeProps {
  value: string;
  label: string;
  className?: string;
}

export function QrCode({ value, label, className }: QrCodeProps) {
  const { t } = useTranslation();
  const matrix = useMemo(() => buildQrMatrix(value), [value]);

  if (!matrix) {
    return (
      <div
        className={cn(
          "flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground",
          className
        )}
      >
        <QrCodeIcon className="size-6" />
        {t("mobileApp.qrFailed")}
      </div>
    );
  }

  const size = matrix.modules + QR_QUIET_ZONE * 2;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={label}
      shapeRendering="crispEdges"
      className={cn("block h-auto w-full rounded-lg border border-border", className)}
    >
      <rect width={size} height={size} fill={neutral.white} />
      <g transform={`translate(${QR_QUIET_ZONE} ${QR_QUIET_ZONE})`}>
        <path d={matrix.path} fill={neutral[900]} />
      </g>
    </svg>
  );
}
