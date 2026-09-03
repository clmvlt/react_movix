import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FileSpreadsheet } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { sheetToRecords, type WorkbookSpec } from "@/lib/xlsx";

const MAX_PREVIEW_ROWS = 500;

export interface SheetPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  sheets: WorkbookSpec;
  canDownload: boolean;
  onDownload: () => void;
}

export function SheetPreviewDialog({
  open,
  onOpenChange,
  title,
  sheets,
  canDownload,
  onDownload,
}: SheetPreviewDialogProps) {
  const { t } = useTranslation();
  const [activeSheet, setActiveSheet] = useState(0);

  useEffect(() => {
    if (open) setActiveSheet(0);
  }, [open]);

  const currentSheet = sheets[activeSheet] ?? null;
  const rowCount = currentSheet?.rows.length ?? 0;
  const truncatedCount = Math.max(0, rowCount - MAX_PREVIEW_ROWS);

  const records = useMemo(() => {
    if (!currentSheet) return [];
    if (truncatedCount === 0) return sheetToRecords(currentSheet);
    return sheetToRecords({
      ...currentSheet,
      rows: currentSheet.rows.slice(0, MAX_PREVIEW_ROWS),
    });
  }, [currentSheet, truncatedCount]);

  const headers = currentSheet?.columns.map((column) => column.header) ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap gap-1">
          {sheets.map((sheet, index) => (
            <Button
              key={sheet.name}
              size="sm"
              variant={activeSheet === index ? "default" : "outline"}
              className="min-h-10"
              onClick={() => setActiveSheet(index)}
            >
              {sheet.name}
              <Badge variant="secondary" className="ml-1 text-[10px]">
                {sheet.rows.length}
              </Badge>
            </Button>
          ))}
        </div>

        {currentSheet?.note && (
          <p className="text-xs text-muted-foreground">{currentSheet.note}</p>
        )}

        {truncatedCount > 0 && (
          <p className="text-xs text-status-warning-text">
            {t("exports.preview.truncated", {
              shown: MAX_PREVIEW_ROWS,
              total: rowCount,
            })}
          </p>
        )}

        {records.length > 0 ? (
          <div className="max-h-[55vh] overflow-auto rounded-lg border border-border">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-background">
                <TableRow>
                  {headers.map((header) => (
                    <TableHead
                      key={header}
                      className="text-xs font-semibold whitespace-nowrap"
                    >
                      {header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((row, index) => (
                  <TableRow key={index}>
                    {headers.map((header) => (
                      <TableCell
                        key={header}
                        className="py-1.5 text-xs whitespace-nowrap"
                      >
                        {row[header]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t("exports.preview.emptySheet")}
          </p>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            className="min-h-11"
            onClick={() => onOpenChange(false)}
          >
            {t("common.close")}
          </Button>
          <Button
            className="min-h-11"
            disabled={!canDownload}
            onClick={() => {
              onOpenChange(false);
              onDownload();
            }}
          >
            <FileSpreadsheet className="size-4" />
            {t("exports.actions.download")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
