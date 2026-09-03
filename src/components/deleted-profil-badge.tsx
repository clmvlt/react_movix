import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { isDeletedProfil } from "@/features/auth";

export function DeletedProfilBadge({
  profil,
  className,
}: {
  profil: { identifiant?: string | null } | null | undefined;
  className?: string;
}) {
  const { t } = useTranslation();
  if (!isDeletedProfil(profil)) return null;
  return (
    <Badge
      variant="outline"
      className={cn("text-muted-foreground", className)}
    >
      {t("profiles.deletedBadge")}
    </Badge>
  );
}
