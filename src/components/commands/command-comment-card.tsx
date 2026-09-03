import { useTranslation } from "react-i18next";
import { MessageSquareText, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/section-card";

interface CommandCommentCardProps {
  comment: string | null | undefined;
  locked: boolean;
  onEdit: () => void;
  className?: string;
}

export function CommandCommentCard({
  comment,
  locked,
  onEdit,
  className,
}: CommandCommentCardProps) {
  const { t } = useTranslation();
  const text = comment?.trim() ?? "";

  return (
    <SectionCard
      title={t("commands.sections.comment")}
      description={t("commands.sections.commentDesc")}
      icon={MessageSquareText}
      className={className}
      contentClassName="flex flex-col gap-4"
    >
      {text ? (
        <p className="whitespace-pre-line break-words text-sm text-foreground">
          {text}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          {t("commands.detail.noComment")}
        </p>
      )}
      <Button
        type="button"
        variant="outline"
        className="min-h-11 w-full sm:w-fit lg:min-h-10"
        disabled={locked}
        onClick={onEdit}
      >
        {text ? <Pencil className="size-4" /> : <Plus className="size-4" />}
        {t(text ? "commands.detail.editComment" : "commands.detail.addComment")}
      </Button>
    </SectionCard>
  );
}
