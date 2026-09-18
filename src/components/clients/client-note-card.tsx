import { useTranslation } from "react-i18next";
import { StickyNote } from "lucide-react";
import { ClientTextArea, SectionCard } from "./client-fields";
import type { ClientFormApi } from "./use-client-form";
import type { Client } from "@/features/clients";

interface ClientNoteCardProps {
  mode: "view" | "edit" | "create";
  client: Client | null;
  api?: ClientFormApi;
  disabled?: boolean;
  className?: string;
}

export function ClientNoteCard({
  mode,
  client,
  api,
  disabled = false,
  className,
}: ClientNoteCardProps) {
  const { t } = useTranslation();

  if (mode === "view" || !api) {
    const note = client?.commentaire?.trim() ?? "";
    return (
      <SectionCard
        title={t("clients.sections.notes")}
        description={t("clients.sections.notesDesc")}
        icon={StickyNote}
        className={className}
      >
        {note ? (
          <p className="whitespace-pre-line break-words text-sm text-foreground">
            {note}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t("clients.info.noNote")}
          </p>
        )}
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title={t("clients.sections.notes")}
      description={t("clients.sections.notesDesc")}
      icon={StickyNote}
      className={className}
    >
      <ClientTextArea
        api={api}
        field="commentaire"
        label={t("clients.fields.commentaire")}
        hint={t("clients.info.commentaireHint")}
        placeholder={t("clients.info.commentairePlaceholder")}
        disabled={disabled}
      />
    </SectionCard>
  );
}
