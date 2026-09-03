import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatDateTime } from "@/lib/date";
import { factureDate, formatMontant, type Facture } from "@/features/factures";
import { FactureActions } from "./facture-actions";

interface FactureCardListProps {
  factures: Facture[];
  onPreview: (facture: Facture) => void;
}

export function FactureCardList({ factures, onPreview }: FactureCardListProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? i18n.language;

  return (
    <ul className="flex flex-col gap-3 lg:hidden">
      {factures.map((facture) => (
        <li
          key={facture.id}
          className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3"
        >
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {formatDate(factureDate(facture), lang)}
              </p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">
                {formatMontant(facture.montantTTC, lang)}
              </p>
            </div>
            <Badge
              variant={facture.isPaid ? "secondary" : "outline"}
              className="shrink-0"
            >
              {facture.isPaid
                ? t("factures.status.paid")
                : t("factures.status.unpaid")}
            </Badge>
          </div>

          <dl className="text-xs">
            <dt className="text-muted-foreground">
              {t("factures.columns.createdAt")}
            </dt>
            <dd className="text-foreground">
              {formatDateTime(facture.createdAt, lang) || "-"}
            </dd>
          </dl>

          <FactureActions
            facture={facture}
            onPreview={onPreview}
            className="justify-end border-t border-border pt-2"
          />
        </li>
      ))}
    </ul>
  );
}
