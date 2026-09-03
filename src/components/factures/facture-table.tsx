import { useTranslation } from "react-i18next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatDateTime } from "@/lib/date";
import {
  factureDate,
  formatMontant,
  type Facture,
} from "@/features/factures";
import { FactureActions } from "./facture-actions";

interface FactureTableProps {
  factures: Facture[];
  onPreview: (facture: Facture) => void;
}

export function FactureTable({ factures, onPreview }: FactureTableProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? i18n.language;

  return (
    <div className="hidden w-full rounded-xl border border-border lg:block">
      <Table className="min-w-[720px]">
        <TableHeader>
          <TableRow>
            <TableHead>{t("factures.columns.date")}</TableHead>
            <TableHead className="text-right">
              {t("factures.columns.amount")}
            </TableHead>
            <TableHead>{t("common.status")}</TableHead>
            <TableHead>{t("factures.columns.createdAt")}</TableHead>
            <TableHead className="text-right">{t("common.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {factures.map((facture) => (
            <TableRow key={facture.id}>
              <TableCell className="py-3 font-medium text-foreground">
                {formatDate(factureDate(facture), lang)}
              </TableCell>
              <TableCell className="py-3 text-right font-medium tabular-nums text-foreground">
                {formatMontant(facture.montantTTC, lang)}
              </TableCell>
              <TableCell className="py-3">
                <Badge variant={facture.isPaid ? "secondary" : "outline"}>
                  {facture.isPaid
                    ? t("factures.status.paid")
                    : t("factures.status.unpaid")}
                </Badge>
              </TableCell>
              <TableCell className="py-3 text-sm text-muted-foreground">
                {formatDateTime(facture.createdAt, lang) || "-"}
              </TableCell>
              <TableCell className="py-3">
                <FactureActions
                  facture={facture}
                  onPreview={onPreview}
                  className="justify-end"
                  compact
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
