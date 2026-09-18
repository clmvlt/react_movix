import { useTranslation } from "react-i18next";
import { FileText, Mail, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  clientLabel,
  isPharmacyClient,
} from "@/features/clients";
import { AnomalyTypeBadge } from "@/components/anomalies/anomaly-type";
import { formatDate, formatTime } from "@/lib/date";
import { profilFullName } from "@/features/auth";
import type { Anomaly } from "@/features/anomalies";

interface AnomalyTableProps {
  rows: Anomaly[];
  onOpen: (id: string) => void;
  onEmail: (id: string) => void;
  onPdf: (id: string) => void;
}

export function AnomalyTable({
  rows,
  onOpen,
  onEmail,
  onPdf,
}: AnomalyTableProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? "en";

  return (
    <div className="w-full rounded-t-xl border-x border-t">
      <Table className="table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead>{t("anomalies.columns.pharmacy")}</TableHead>
            <TableHead className="hidden w-[112px] md:table-cell">
              {t("clients.fields.cip")}
            </TableHead>
            <TableHead className="hidden w-[160px] sm:table-cell">
              {t("anomalies.columns.type")}
            </TableHead>
            <TableHead className="hidden w-[150px] md:table-cell">
              {t("clients.columns.place")}
            </TableHead>
            <TableHead className="w-[112px]">
              {t("anomalies.columns.createdAt")}
            </TableHead>
            <TableHead className="hidden w-[150px] lg:table-cell">
              {t("anomalies.columns.declaredBy")}
            </TableHead>
            <TableHead className="hidden xl:table-cell">
              {t("anomalies.columns.description")}
            </TableHead>
            <TableHead className="w-[68px] text-right lg:w-[60px]">
              <span className="sr-only">{t("common.actions")}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const client = row.client ?? null;
            const cip =
              client && isPharmacyClient(client) ? client.cip : null;
            const label = client
              ? clientLabel(client) || t("clients.untitled")
              : t("clients.untitled");
            const location = [client?.postalCode, client?.city]
              .filter(Boolean)
              .join(" ");
            return (
              <TableRow
                key={row.id}
                className="cursor-pointer"
                onClick={() => onOpen(row.id)}
              >
                <TableCell className="font-medium">
                  <span className="block truncate">{label}</span>
                  <span className="mt-1 block sm:hidden">
                    <AnomalyTypeBadge type={row.typeAnomalie} />
                  </span>
                  <span className="mt-0.5 block truncate text-xs font-normal text-muted-foreground md:hidden">
                    {[cip, location].filter(Boolean).join(" - ")}
                  </span>
                </TableCell>
                <TableCell className="hidden tabular-nums text-muted-foreground md:table-cell">
                  <span className="block truncate">{cip ?? "-"}</span>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <AnomalyTypeBadge type={row.typeAnomalie} />
                </TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">
                  <span className="block truncate">{location}</span>
                </TableCell>
                <TableCell className="tabular-nums text-muted-foreground">
                  <span className="block truncate">
                    {formatDate(row.createdAt, lang)}
                  </span>
                  <span className="block truncate text-xs">
                    {formatTime(row.createdAt, lang)}
                  </span>
                </TableCell>
                <TableCell className="hidden text-muted-foreground lg:table-cell">
                  <span className="block truncate">
                    {profilFullName(row.profil)}
                  </span>
                </TableCell>
                <TableCell className="hidden text-muted-foreground xl:table-cell">
                  <span className="block truncate">{row.other ?? ""}</span>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-11 lg:size-9"
                        onClick={(event) => event.stopPropagation()}
                        aria-label={t("common.actions")}
                      >
                        <MoreVertical />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <DropdownMenuItem
                        className="min-h-11 lg:min-h-9"
                        onSelect={() => onOpen(row.id)}
                      >
                        {t("anomalies.open")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="min-h-11 lg:min-h-9"
                        onSelect={() => onEmail(row.id)}
                      >
                        <Mail />
                        {t("anomalies.email.action")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="min-h-11 lg:min-h-9"
                        onSelect={() => onPdf(row.id)}
                      >
                        <FileText />
                        {t("anomalies.pdf.download")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
