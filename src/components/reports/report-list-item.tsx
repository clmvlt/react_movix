import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Building2, Image, MapPinOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { clientLabel } from "@/features/clients";
import { formatDateTime } from "@/lib/date";
import type { ClientReport } from "@/features/client-reports";

interface ReportListItemProps {
  report: ClientReport;
  selected: boolean;
  onSelect: (id: string) => void;
}

export function ReportListItem({
  report,
  selected,
  onSelect,
}: ReportListItemProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? "en";
  const ref = useRef<HTMLLIElement | null>(null);

  useEffect(() => {
    if (!selected) return;
    ref.current?.scrollIntoView({ block: "nearest" });
  }, [selected]);

  const clientName = report.client
    ? clientLabel(report.client)
    : t("clientReports.noPharmacy");
  const location = [report.client?.postalCode, report.client?.city]
    .filter(Boolean)
    .join(" ");
  const author = [report.profil?.firstName, report.profil?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    <li ref={ref}>
      <button
        type="button"
        onClick={() => onSelect(report.id)}
        aria-current={selected ? "true" : undefined}
        className={cn(
          "flex min-h-11 w-full flex-col gap-1.5 rounded-xl border bg-card p-3 text-left transition-colors hover:border-primary/40 hover:bg-accent/30",
          selected && "border-primary/40 bg-accent ring-1 ring-ring"
        )}
      >
        <span className="flex w-full items-center gap-2">
          <Building2 className="size-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
            {clientName}
          </span>
        </span>
        {location && (
          <span className="block w-full truncate text-xs text-muted-foreground">
            {location}
          </span>
        )}
        {(report.invalidGeocodage === true || report.pictures.length > 0) && (
          <span className="flex flex-wrap items-center gap-1.5">
            {report.invalidGeocodage === true && (
              <Badge variant="outline">
                <MapPinOff className="size-3" />
                {t("clientReports.invalidGeocodage")}
              </Badge>
            )}
            {report.pictures.length > 0 && (
              <Badge variant="secondary">
                <Image className="size-3" />
                {t("clientReports.photoCount", {
                  count: report.pictures.length,
                })}
              </Badge>
            )}
          </span>
        )}
        {report.commentaire?.trim() && (
          <span className="line-clamp-2 w-full break-words text-xs text-foreground">
            {report.commentaire}
          </span>
        )}
        <span className="block w-full truncate text-xs text-muted-foreground">
          {t("clientReports.author")}{" "}
          {author || t("clientReports.unknownAuthor")} -{" "}
          {formatDateTime(report.createdAt, lang)}
        </span>
      </button>
    </li>
  );
}
