import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatTime } from "@/lib/date";
import type { CommandSearchResult } from "@/features/commands";

interface CommandSearchTableProps {
  rows: CommandSearchResult[];
  onOpen: (id: string) => void;
}

function addressOf(row: CommandSearchResult): string {
  return [row.pharmacyAddress1, row.pharmacyAddress2, row.pharmacyAddress3]
    .filter(Boolean)
    .join(" ");
}

export function CommandSearchTable({
  rows,
  onOpen,
}: CommandSearchTableProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? "en";

  return (
    <div className="w-full rounded-t-xl border-x border-t">
      <Table className="table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead>{t("commands.pharmacy")}</TableHead>
            <TableHead className="hidden w-[160px] sm:table-cell">
              {t("pharmacies.columns.location")}
            </TableHead>
            <TableHead className="hidden xl:table-cell">
              {t("common.address")}
            </TableHead>
            <TableHead className="w-[112px]">{t("commands.expDate")}</TableHead>
            <TableHead className="hidden xl:table-cell">
              {t("common.comment")}
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
                className="cursor-pointer"
                onClick={() => onOpen(row.id)}
              >
                <TableCell className="font-medium">
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
                  <span className="mt-0.5 block w-full truncate text-xs font-normal text-muted-foreground sm:hidden">
                    {location}
                  </span>
                </TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">
                  <span className="block truncate">{location}</span>
                </TableCell>
                <TableCell className="hidden text-muted-foreground xl:table-cell">
                  <span className="block truncate">{addressOf(row)}</span>
                </TableCell>
                <TableCell className="tabular-nums text-muted-foreground">
                  <span className="block truncate">
                    {formatDate(row.expDate, lang)}
                  </span>
                  <span className="block truncate text-xs">
                    {formatTime(row.expDate, lang)}
                  </span>
                </TableCell>
                <TableCell className="hidden text-muted-foreground xl:table-cell">
                  <span className="block truncate">{row.comment ?? ""}</span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
