import { useTranslation } from "react-i18next";
import { PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/date";
import type { PackageSouffranceResult } from "@/features/packages";

interface SouffrancePackagesTableProps {
  rows: PackageSouffranceResult[];
  selected: Set<string>;
  onToggle: (barcode: string) => void;
  onToggleAll: () => void;
  onOpenCommand: (commandId: string) => void;
}

export function SouffrancePackagesTable({
  rows,
  selected,
  onToggle,
  onToggleAll,
  onOpenCommand,
}: SouffrancePackagesTableProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? "en";

  const allSelected =
    rows.length > 0 && rows.every((row) => selected.has(row.barcode));
  const someSelected = rows.some((row) => selected.has(row.barcode));

  return (
    <div className="w-full rounded-t-xl border-x border-t">
      <Table className="table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead
              className="w-[44px] cursor-pointer"
              onClick={onToggleAll}
            >
              <Checkbox
                checked={
                  allSelected ? true : someSelected ? "indeterminate" : false
                }
                onClick={(event) => event.stopPropagation()}
                onCheckedChange={onToggleAll}
                aria-label={t("souffrance.selectAll")}
              />
            </TableHead>
            <TableHead className="w-[140px] sm:w-[160px]">
              {t("commands.detail.barcode")}
            </TableHead>
            <TableHead>{t("commands.detail.designation")}</TableHead>
            <TableHead className="hidden w-[64px] md:table-cell">
              {t("commands.detail.quantity")}
            </TableHead>
            <TableHead className="hidden w-[90px] md:table-cell">
              {t("commands.detail.weight")}
            </TableHead>
            <TableHead className="hidden w-[110px] xl:table-cell">
              {t("commands.detail.zone")}
            </TableHead>
            <TableHead className="hidden sm:table-cell">
              {t("commands.pharmacy")}
            </TableHead>
            <TableHead className="hidden w-[130px] lg:table-cell">
              {t("commands.expDate")}
            </TableHead>
            <TableHead className="w-[68px] text-right lg:w-[60px]">
              {t("souffrance.columns.order")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const commandId = row.commandId?.trim() ?? "";
            const pharmacy = row.pharmacyName?.trim() || t("clients.untitled");
            const location = [row.pharmacyCodePostal, row.pharmacyCity]
              .filter(Boolean)
              .join(" ");
            return (
              <TableRow
                key={row.barcode}
                data-state={selected.has(row.barcode) ? "selected" : undefined}
              >
                <TableCell
                  className="cursor-pointer"
                  onClick={() => onToggle(row.barcode)}
                >
                  <Checkbox
                    checked={selected.has(row.barcode)}
                    onClick={(event) => event.stopPropagation()}
                    onCheckedChange={() => onToggle(row.barcode)}
                    aria-label={row.barcode}
                  />
                </TableCell>
                <TableCell className="font-medium tabular-nums">
                  <span className="block truncate">{row.barcode}</span>
                  <span className="mt-0.5 block truncate text-xs font-normal text-muted-foreground sm:hidden">
                    {pharmacy}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <span className="block truncate">
                    {row.designation ?? row.type ?? ""}
                  </span>
                </TableCell>
                <TableCell className="hidden tabular-nums text-muted-foreground md:table-cell">
                  {row.quantity ?? ""}
                </TableCell>
                <TableCell className="hidden tabular-nums text-muted-foreground md:table-cell">
                  {row.weight != null ? `${row.weight} kg` : ""}
                </TableCell>
                <TableCell className="hidden text-muted-foreground xl:table-cell">
                  <span className="block truncate">{row.zoneName ?? ""}</span>
                </TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">
                  <span className="block truncate">{pharmacy}</span>
                  <span className="block truncate text-xs">{location}</span>
                </TableCell>
                <TableCell className="hidden text-muted-foreground tabular-nums lg:table-cell">
                  {formatDate(row.expDate, lang)}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-11 lg:size-9"
                    disabled={commandId === ""}
                    onClick={() => onOpenCommand(commandId)}
                    title={t("souffrance.openCommand")}
                    aria-label={t("souffrance.openCommand")}
                  >
                    <PackageSearch className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
