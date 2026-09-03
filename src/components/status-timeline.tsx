import { useTranslation } from "react-i18next";
import { DeletedProfilBadge } from "@/components/deleted-profil-badge";
import { getStatusTokens, type StatusCategory } from "@/lib/colors";
import { formatDateTime } from "@/lib/date";

export interface StatusTimelineEntry {
  id: number;
  name: string;
  createdAt?: string;
  profil?: {
    firstName?: string | null;
    lastName?: string | null;
    identifiant?: string | null;
  } | null;
}

function authorOf(entry: StatusTimelineEntry): string {
  if (!entry.profil) return "";
  const name = [entry.profil.firstName, entry.profil.lastName]
    .filter(Boolean)
    .join(" ");
  return name || entry.profil.identifiant || "";
}

interface StatusTimelineProps {
  entries: StatusTimelineEntry[];
  category: (id: number | null | undefined) => StatusCategory;
  emptyMessage: string;
}

export function StatusTimeline({
  entries,
  category,
  emptyMessage,
}: StatusTimelineProps) {
  const { i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? "en";

  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <ol className="space-y-3">
      {entries.map((entry, index) => {
        const author = authorOf(entry);
        return (
          <li key={`${entry.id}-${index}`} className="flex gap-3">
            <span
              className="mt-1 size-2.5 shrink-0 rounded-full"
              style={{
                backgroundColor: getStatusTokens(category(entry.id)).strong,
              }}
              aria-hidden
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">
                {entry.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDateTime(entry.createdAt, lang)}
                {author && ` - ${author}`}
                <DeletedProfilBadge profil={entry.profil} className="ml-1.5" />
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
