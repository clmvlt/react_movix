import { useTranslation } from "react-i18next";
import { Check, ChevronDown, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InitialsImage } from "@/components/initials-image";
import { useAuth } from "@/app/auth-context";
import { imageUrl } from "@/lib/images";
import { initialsFromLabel } from "@/lib/initials";
import { cn } from "@/lib/utils";

interface AccountSwitcherProps {
  className?: string;
  onJoinCompany?: () => void;
}

export function AccountSwitcher({
  className,
  onJoinCompany,
}: AccountSwitcherProps) {
  const { t } = useTranslation();
  const { accounts, selectedAccountId, switchAccount } = useAuth();

  if (accounts.length <= 1) return null;

  const current =
    accounts.find((m) => m.account.id === selectedAccountId) ?? null;
  const currentName = current?.account.societe ?? "";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "min-h-11 min-w-0 shrink gap-2 px-1.5 md:px-2 lg:min-h-10",
            className
          )}
          aria-label={t("nav.companySwitch", { company: currentName })}
          title={currentName}
        >
          <InitialsImage
            src={imageUrl(current?.account.logoUrl)}
            initials={initialsFromLabel(currentName)}
            alt={currentName}
            className="size-7 shrink-0 rounded-md object-cover"
            fallbackClassName="bg-primary/10 text-xs font-semibold text-primary"
          />
          <span className="hidden min-w-0 max-w-40 truncate text-sm font-medium md:block">
            {currentName}
          </span>
          <ChevronDown className="hidden size-4 shrink-0 text-muted-foreground md:block" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>{t("nav.companyLabel")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {accounts.map((membership) => {
          const selected = membership.account.id === selectedAccountId;
          return (
            <DropdownMenuItem
              key={membership.account.id}
              onSelect={() => switchAccount(membership.account.id)}
              className="min-h-11 gap-2 lg:min-h-10"
            >
              <InitialsImage
                src={imageUrl(membership.account.logoUrl)}
                initials={initialsFromLabel(membership.account.societe)}
                alt=""
                className="size-8 shrink-0 rounded-md object-cover"
                fallbackClassName="bg-primary/10 text-xs font-semibold text-primary"
              />
              <span className="min-w-0 flex-1 truncate">
                {membership.account.societe}
              </span>
              {membership.isAdmin && (
                <Badge variant="secondary" className="shrink-0">
                  {t("profiles.access.admin")}
                </Badge>
              )}
              {selected && <Check className="size-4 shrink-0 text-primary" />}
            </DropdownMenuItem>
          );
        })}
        {onJoinCompany && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={onJoinCompany}
              className="min-h-11 gap-2 lg:min-h-10"
            >
              <UserPlus className="size-4 shrink-0 text-muted-foreground" />
              {t("nav.joinCompany")}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
