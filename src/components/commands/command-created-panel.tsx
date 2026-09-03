import { useTranslation } from "react-i18next";
import { CheckCircle2, FileText, Plus, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/states";
import { usePdfPreview } from "@/app/pdf-preview-context";
import { packageKeys, packagesApi } from "@/features/packages";
import type { CommandCreateResult } from "@/features/commands";

interface CommandCreatedPanelProps {
  result: CommandCreateResult;
  pharmacyName: string;
  onOpenCommand: () => void;
  onCreateAnother: () => void;
}

export function CommandCreatedPanel({
  result,
  pharmacyName,
  onOpenCommand,
  onCreateAnother,
}: CommandCreatedPanelProps) {
  const { t } = useTranslation();
  const openPdfPreview = usePdfPreview();

  const parcels = result.packages ?? [];

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
    <div className="flex flex-1 flex-col gap-4">
      <Alert variant="success">
        <CheckCircle2 />
        <div>
          <AlertTitle>{t("commands.create.success.title")}</AlertTitle>
          <AlertDescription>
            {t("commands.create.success.subtitle", { name: pharmacyName })}
          </AlertDescription>
        </div>
      </Alert>

      {parcels.length === 0 && (
        <Alert variant="warning">
          <TriangleAlert />
          <div>
            <AlertTitle>{t("commands.create.success.noParcels")}</AlertTitle>
            <AlertDescription>
              {t("commands.create.success.noParcelsHint")}
            </AlertDescription>
          </div>
        </Alert>
      )}

      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            {t("commands.create.success.orderId")}
          </p>
          <p className="mt-1 break-all font-medium tabular-nums text-foreground">
            {result.id_command}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t("commands.detail.parcels")} ({parcels.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {parcels.length === 0 ? (
            <EmptyState message={t("commands.detail.noParcels")} />
          ) : (
            <div className="w-full overflow-x-auto rounded-lg border">
              <Table className="lg:table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("commands.detail.designation")}</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      {t("commands.detail.barcode")}
                    </TableHead>
                    <TableHead className="hidden w-[140px] lg:table-cell">
                      {t("commands.detail.zone")}
                    </TableHead>
                    <TableHead className="w-[64px]">
                      {t("commands.detail.quantity")}
                    </TableHead>
                    <TableHead className="w-[160px] text-right">
                      {t("commands.create.success.label")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parcels.map((parcel, index) => {
                    const barcode = parcel.barcode?.trim() ?? "";
                    return (
                      <TableRow key={barcode || parcel.id || index}>
                        <TableCell className="text-foreground">
                          {parcel.designation ?? parcel.type ?? "-"}
                          <span className="mt-0.5 block truncate text-xs tabular-nums text-muted-foreground sm:hidden">
                            {barcode}
                          </span>
                        </TableCell>
                        <TableCell className="hidden tabular-nums text-muted-foreground sm:table-cell">
                          <span className="block truncate">
                            {barcode || "-"}
                          </span>
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground lg:table-cell">
                          <span className="block truncate">
                            {parcel.zoneName ?? "-"}
                          </span>
                        </TableCell>
                        <TableCell className="tabular-nums text-muted-foreground">
                          {parcel.quantity ?? "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            variant="outline"
                            className="min-h-11 lg:min-h-9"
                            disabled={barcode === ""}
                            onClick={() => showLabel(barcode)}
                          >
                            <FileText />
                            {t("commands.create.success.label")}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button className="min-h-11 sm:min-h-10" onClick={onOpenCommand}>
          {t("commands.create.success.open")}
        </Button>
        <Button
          variant="outline"
          className="min-h-11 sm:min-h-10"
          onClick={onCreateAnother}
        >
          <Plus />
          {t("commands.create.success.again")}
        </Button>
      </div>
    </div>
  );
}
