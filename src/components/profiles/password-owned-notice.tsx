import { useTranslation } from "react-i18next";
import { KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiErrorText } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import { useToast } from "@/app/toast-context";
import { useForgotPassword } from "@/features/profiles";

interface PasswordOwnedNoticeProps {
  email?: string | null;
  className?: string;
}

export function PasswordOwnedNotice({
  email,
  className,
}: PasswordOwnedNoticeProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const forgotPassword = useForgotPassword();

  const target = email?.trim() ?? "";

  const sendResetLink = () => {
    if (!target) return;
    forgotPassword.mutate(
      { email: target },
      {
        onSuccess: () =>
          toast.success(t("profiles.password.resetSent", { email: target })),
        onError: (err) => toast.error(apiErrorText(err) ?? t("common.error")),
      }
    );
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-xl border border-border bg-muted/50 p-3",
        className
      )}
    >
      <p className="text-xs leading-4 text-muted-foreground">
        {t("profiles.password.ownedByUser")}
      </p>
      {target ? (
        <>
          <Button
            type="button"
            variant="outline"
            className="min-h-11 w-full sm:w-fit lg:min-h-10"
            onClick={sendResetLink}
            disabled={forgotPassword.isPending}
          >
            {forgotPassword.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <KeyRound className="size-4" />
            )}
            {t("profiles.password.resetAction")}
          </Button>
          <p className="text-xs leading-4 text-muted-foreground">
            {t("profiles.password.resetHint")}
          </p>
        </>
      ) : (
        <p className="text-xs leading-4 text-muted-foreground">
          {t("profiles.password.noEmail")}
        </p>
      )}
    </div>
  );
}
