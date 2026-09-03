import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CopyId } from "@/components/souffrance/copy-id";
import { formatDate, formatDateTime } from "@/lib/date";
import type { CommandSearchResult } from "@/features/commands";

interface SouffranceCommandsTableProps {
  rows: CommandSearchResult[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  onOpen: (id: string) => void;
}

export function SouffranceCommandsTable({
  rows,
  selected,
  onToggle,
  onToggleAll,
  onOpen,
}: SouffranceCommandsTableProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? "en";

  const allSelected = rows.length > 0 && rows.every((row) => selected.has(row.id));
  const someSelected = rows.some((row) => selected.has(row.id));

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
            <TableHead>{t("commands.pharmacy")}</TableHead>
            <TableHead className="hidden w-[160px] sm:table-cell">
              {t("pharmacies.columns.location")}
            </TableHead>
            <TableHead className="w-[130px]">{t("commands.expDate")}</TableHead>
            <TableHead className="hidden w-[200px] md:table-cell">
              {t("souffrance.columns.flagged")}
            </TableHead>
            <TableHead className="hidden xl:table-cell">
              {t("common.comment")}
            </TableHead>
            <TableHead className="hidden w-[120px] xl:table-cell">
              {t("commands.filters.commandId")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const label = row.pharmacyName?.trim() || t("pharmacies.untitled");
            const location = [row.pharmacyCodePostal, row.pharmacyCity]
              .filter(Boolean)
              .join(" ");
            return (
              <TableRow
                key={row.id}
                data-state={selected.has(row.id) ? "selected" : undefined}
              >
                <TableCell
                  className="cursor-pointer"
                  onClick={() => onToggle(row.id)}
                >
                  <Checkbox
                    checked={selected.has(row.id)}
                    onClick={(event) => event.stopPropagation()}
                    onCheckedChange={() => onToggle(row.id)}
                    aria-label={label}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  <button
                    type="button"
                    onClick={() => onOpen(row.id)}
                    className="flex min-h-10 w-full min-w-0 flex-col justify-center text-left"
                  >
                    <span className="flex w-full min-w-0 items-center gap-1.5">
                      <span className="min-w-0 truncate">{label}</span>
                      {row.newPharmacy && (
                        <Badge
                          className="shrink-0 px-1.5 py-0 text-[10px] uppercase leading-4"
                          aria-label={t("commands.newPharmacyTitle")}
                        >
                          {t("commands.newPharmacy")}
                        </Badge>
                      )}
                    </span>
                    <span className="block w-full truncate text-xs font-normal text-muted-foreground sm:hidden">
                      {location}
                    </span>
                  </button>
                </TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">
                  <span className="block truncate">{location}</span>
                </TableCell>
                <TableCell className="text-muted-foreground tabular-nums">
                  {formatDate(row.expDate, lang)}
                </TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">
                  <span className="block truncate">
                    {formatDateTime(row.souffranceDate, lang)}
                  </span>
                  <span className="block truncate text-xs">
                    {row.souffranceByName ?? ""}
                  </span>
                </TableCell>
                <TableCell className="hidden text-muted-foreground xl:table-cell">
                  <span className="block truncate">{row.comment ?? ""}</span>
                </TableCell>
                <TableCell className="hidden xl:table-cell">
                  <CopyId value={row.id} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
