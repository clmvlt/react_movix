import { useTranslation } from "react-i18next";
import { StickyNote } from "lucide-react";
import {
  PharmacyTextArea,
  SectionCard,
} from "@/components/pharmacies/pharmacy-fields";
import type { PharmacyFormApi } from "@/components/pharmacies/use-pharmacy-form";
import type { Pharmacy } from "@/features/pharmacies";

interface PharmacyNoteCardProps {
  mode: "view" | "edit" | "create";
  pharmacy: Pharmacy | null;
  api?: PharmacyFormApi;
  disabled?: boolean;
  className?: string;
}

export function PharmacyNoteCard({
  mode,
  pharmacy,
  api,
  disabled = false,
  className,
}: PharmacyNoteCardProps) {
  const { t } = useTranslation();

  if (mode === "view" || !api) {
    const note = pharmacy?.commentaire?.trim() ?? "";
    return (
      <SectionCard
        title={t("pharmacies.sections.notes")}
        description={t("pharmacies.sections.notesDesc")}
        icon={StickyNote}
        className={className}
      >
        {note ? (
          <p className="whitespace-pre-line break-words text-sm text-foreground">
            {note}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t("pharmacies.info.noNote")}
          </p>
        )}
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title={t("pharmacies.sections.notes")}
      description={t("pharmacies.sections.notesDesc")}
      icon={StickyNote}
      className={className}
    >
      <PharmacyTextArea
        api={api}
        field="commentaire"
        label={t("pharmacies.info.commentaire")}
        hint={t("pharmacies.info.commentaireHint")}
        placeholder={t("pharmacies.info.commentairePlaceholder")}
        disabled={disabled}
      />
    </SectionCard>
  );
}
