import { useTranslation } from "react-i18next";
import { Smartphone, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfilKindIconProps {
  profil: { userId?: string | null };
  className?: string;
}

export function ProfilKindIcon({ profil, className }: ProfilKindIconProps) {
  const { t } = useTranslation();
  const linked = Boolean(profil.userId);
  const label = linked ? t("profiles.kind.user") : t("profiles.kind.mobile");

  return (
    <span
      title={label}
      aria-label={label}
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full",
        linked
          ? "bg-primary/10 text-primary"
          : "bg-muted text-muted-foreground",
        className
      )}
    >
      {linked ? (
        <UserRound className="size-4" />
      ) : (
        <Smartphone className="size-4" />
      )}
    </span>
  );
}
