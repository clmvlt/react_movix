import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CopyId } from "@/components/copy-id";
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

export function CommandSearchTable({ rows, onOpen }: CommandSearchTableProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? "en";

  return (
    <div className="w-full overflow-x-auto rounded-t-xl border-x border-t">
      <Table className="min-w-[640px] table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead>{t("commands.pharmacy")}</TableHead>
            <TableHead className="hidden w-[104px] md:table-cell">
              {t("clients.fields.cip")}
            </TableHead>
            <TableHead className="hidden w-[150px] sm:table-cell">
              {t("clients.columns.place")}
            </TableHead>
            <TableHead className="hidden 2xl:table-cell">
              {t("clients.fields.address1")}
            </TableHead>
            <TableHead className="w-[112px]">{t("commands.expDate")}</TableHead>
            <TableHead className="w-[124px]">
              {t("commands.filters.commandId")}
            </TableHead>
            <TableHead className="hidden xl:table-cell">
              {t("common.comment")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const label = row.pharmacyName?.trim() || t("clients.untitled");
            const location = [row.pharmacyCodePostal, row.pharmacyCity]
              .filter(Boolean)
              .join(" ");
            const cip = row.clientCip?.trim() ?? "";
            return (
              <TableRow
                key={row.id}
                className="cursor-pointer"
                onClick={() => onOpen(row.id)}
              >
                <TableCell className="font-medium">
                  <span className="flex w-full min-w-0 items-center gap-1.5">
                    {row.clientId ? (
                      <Link
                        to={`/app/clients/${encodeURIComponent(row.clientId)}`}
                        onClick={(event) => event.stopPropagation()}
                        className="min-w-0 truncate underline-offset-4 hover:underline"
                      >
                        {label}
                      </Link>
                    ) : (
                      <span className="min-w-0 truncate">{label}</span>
                    )}
                    {row.newPharmacy && (
                      <Badge
                        className="shrink-0 px-1.5 py-0 text-[10px] uppercase leading-4"
                        aria-label={t("commands.newPharmacyTitle")}
                      >
                        {t("commands.newPharmacy")}
                      </Badge>
                    )}
                  </span>
                  <span className="mt-0.5 block w-full truncate text-xs font-normal text-muted-foreground md:hidden">
                    {[cip, location].filter(Boolean).join(" - ")}
                  </span>
                </TableCell>
                <TableCell className="hidden tabular-nums text-muted-foreground md:table-cell">
                  <span className="block truncate">{cip || "-"}</span>
                </TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">
                  <span className="block truncate">{location}</span>
                </TableCell>
                <TableCell className="hidden text-muted-foreground 2xl:table-cell">
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
                <TableCell
                  className="text-muted-foreground"
                  onClick={(event) => event.stopPropagation()}
                >
                  <CopyId value={row.id} />
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
