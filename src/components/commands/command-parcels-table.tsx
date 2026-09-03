import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FileText, History, PackageX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { PackageSouffranceDialog } from "@/components/souffrance/package-souffrance-dialog";
import { PackageHistoryDialog } from "@/components/packages/package-history-dialog";
import { PackageStatusDialog } from "@/components/packages/package-status-dialog";
import { packageStatusCategory } from "@/lib/status";
import { cn } from "@/lib/utils";
import { usePdfPreview } from "@/app/pdf-preview-context";
import type { CommandPackage } from "@/features/commands";
import { packageKeys, packagesApi } from "@/features/packages";

type TableBreakpoint = "lg" | "xl";

const CARDS_CLASS: Record<TableBreakpoint, string> = {
  lg: "flex flex-col gap-2 lg:hidden",
  xl: "flex flex-col gap-2 xl:hidden",
};

const TABLE_CLASS: Record<TableBreakpoint, string> = {
  lg: "hidden w-full overflow-x-auto rounded-lg border lg:block",
  xl: "hidden w-full overflow-x-auto rounded-lg border xl:block",
};

interface CommandParcelsTableProps {
  parcels: CommandPackage[];
  allowSouffrance?: boolean;
  onSouffranceDone?: () => void;
  allowStatusChange?: boolean;
  onStatusDone?: () => void;
  tableFrom?: TableBreakpoint;
}

interface ParcelRef {
  barcode: string;
  label: string;
}

export function CommandParcelsTable({
  parcels,
  allowSouffrance = false,
  onSouffranceDone,
  allowStatusChange = false,
  onStatusDone,
  tableFrom = "lg",
}: CommandParcelsTableProps) {
  const { t } = useTranslation();
  const openPdfPreview = usePdfPreview();
  const [souffranceParcel, setSouffranceParcel] = useState<ParcelRef | null>(
    null
  );
  const [historyParcel, setHistoryParcel] = useState<ParcelRef | null>(null);
  const [statusParcel, setStatusParcel] = useState<ParcelRef | null>(null);

  const showLabel = (barcode: string) => {
    openPdfPreview({
      key: packageKeys.label(barcode),
      title: t("commands.detail.labelTitle"),
      subtitle: barcode,
      filename: `${barcode}.pdf`,
      load: () => packagesApi.label(barcode),
      describeError: () => t("commands.detail.labelFailed"),
    });
  };

  return (
    <div className="w-full">
      <ul className={CARDS_CLASS[tableFrom]}>
        {parcels.map((parcel, index) => {
          const barcode = parcel.barcode?.trim() ?? "";
          const parcelRef: ParcelRef = {
            barcode,
            label: parcel.designation?.trim() || parcel.type?.trim() || "",
          };
          const meta = [
            parcel.quantity != null
              ? `${t("commands.detail.quantity")} ${parcel.quantity}`
              : null,
            parcel.weight != null ? `${parcel.weight} kg` : null,
            parcel.zoneName ?? null,
          ]
            .filter(Boolean)
            .join(" - ");
          return (
            <li
              key={barcode || parcel.id || index}
              className="rounded-lg border bg-card p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {parcel.designation ?? parcel.type ?? "-"}
                  </p>
                  <p className="truncate text-xs tabular-nums text-muted-foreground">
                    {barcode || parcel.id || "-"}
                  </p>
                  {meta && (
                    <p className="mt-1 text-xs tabular-nums text-muted-foreground">
                      {meta}
                    </p>
                  )}
                </div>
                {parcel.status && (
                  <StatusBadge
                    label={parcel.status.name}
                    category={packageStatusCategory(parcel.status.id)}
                    className="min-h-10 shrink-0 px-3 py-1.5"
                    onEdit={
                      allowStatusChange && barcode !== ""
                        ? () => setStatusParcel(parcelRef)
                        : undefined
                    }
                    editLabel={t("packages.status.title")}
                  />
                )}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 border-t pt-3">
                <Button
                  variant="outline"
                  className="min-h-11 min-w-0"
                  disabled={barcode === ""}
                  onClick={() => setHistoryParcel(parcelRef)}
                  aria-label={t("packages.history.title")}
                >
                  <History />
                  {t("commands.detail.historyShort")}
                </Button>
                <Button
                  variant="outline"
                  className="min-h-11 min-w-0"
                  disabled={barcode === ""}
                  onClick={() => showLabel(barcode)}
                  aria-label={t("commands.detail.label")}
                >
                  <FileText />
                  {t("commands.detail.labelShort")}
                </Button>
                {allowSouffrance && (
                  <Button
                    variant="outline"
                    className="col-span-2 min-h-11 min-w-0"
                    disabled={barcode === ""}
                    onClick={() => setSouffranceParcel(parcelRef)}
                    aria-label={t("souffrance.flagPackages.action")}
                  >
                    <PackageX />
                    {t("expeditions.actionsShort.souffrance")}
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div className={TABLE_CLASS[tableFrom]}>
        <Table className={cn(tableFrom === "lg" ? "lg:table-fixed" : "xl:table-fixed")}>
          <TableHeader>
            <TableRow>
              <TableHead>{t("commands.detail.designation")}</TableHead>
              <TableHead className="w-27.5">
                {t("commands.detail.zone")}
              </TableHead>
              <TableHead className="w-14">
                {t("commands.detail.quantity")}
              </TableHead>
              <TableHead className="w-20">
                {t("commands.detail.weight")}
              </TableHead>
              <TableHead className="w-37.5">{t("common.status")}</TableHead>
              <TableHead
                className={cn(
                  "text-right",
                  allowSouffrance ? "w-34" : "w-24"
                )}
              >
                {t("common.actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {parcels.map((parcel, index) => {
              const barcode = parcel.barcode?.trim() ?? "";
              const parcelRef: ParcelRef = {
                barcode,
                label: parcel.designation?.trim() || parcel.type?.trim() || "",
              };
              return (
                <TableRow key={barcode || parcel.id || index}>
                  <TableCell>
                    <span className="block truncate text-foreground">
                      {parcel.designation ?? parcel.type ?? "-"}
                    </span>
                    <span className="block truncate text-xs tabular-nums text-muted-foreground">
                      {barcode || parcel.id || "-"}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <span className="block truncate">
                      {parcel.zoneName ?? "-"}
                    </span>
                  </TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {parcel.quantity ?? "-"}
                  </TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {parcel.weight != null ? `${parcel.weight} kg` : "-"}
                  </TableCell>
                  <TableCell>
                    {parcel.status && (
                      <StatusBadge
                        label={parcel.status.name}
                        category={packageStatusCategory(parcel.status.id)}
                        onEdit={
                          allowStatusChange && barcode !== ""
                            ? () => setStatusParcel(parcelRef)
                            : undefined
                        }
                        editLabel={t("packages.status.title")}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1.5">
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-9"
                        disabled={barcode === ""}
                        onClick={() => setHistoryParcel(parcelRef)}
                        title={t("packages.history.title")}
                        aria-label={t("packages.history.title")}
                      >
                        <History />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-9"
                        disabled={barcode === ""}
                        onClick={() => showLabel(barcode)}
                        title={t("commands.detail.label")}
                        aria-label={t("commands.detail.label")}
                      >
                        <FileText />
                      </Button>
                      {allowSouffrance && (
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-9"
                          disabled={barcode === ""}
                          onClick={() => setSouffranceParcel(parcelRef)}
                          title={t("souffrance.flagPackages.action")}
                          aria-label={t("souffrance.flagPackages.action")}
                        >
                          <PackageX />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <PackageHistoryDialog
        open={historyParcel !== null}
        onOpenChange={(open) => !open && setHistoryParcel(null)}
        barcode={historyParcel?.barcode ?? null}
        label={historyParcel?.label}
      />

      {allowStatusChange && (
        <PackageStatusDialog
          open={statusParcel !== null}
          onOpenChange={(open) => !open && setStatusParcel(null)}
          barcodes={statusParcel ? [statusParcel.barcode] : []}
          label={
            statusParcel
              ? [statusParcel.label, statusParcel.barcode]
                  .filter(Boolean)
                  .join(" - ")
              : undefined
          }
          onDone={() => {
            setStatusParcel(null);
            onStatusDone?.();
          }}
        />
      )}

      {allowSouffrance && (
        <PackageSouffranceDialog
          open={souffranceParcel !== null}
          onOpenChange={(open) => !open && setSouffranceParcel(null)}
          barcodes={souffranceParcel ? [souffranceParcel.barcode] : []}
          label={
            souffranceParcel
              ? [souffranceParcel.label, souffranceParcel.barcode]
                  .filter(Boolean)
                  .join(" - ")
              : undefined
          }
          onDone={() => {
            setSouffranceParcel(null);
            onSouffranceDone?.();
          }}
        />
      )}
    </div>
  );
}
