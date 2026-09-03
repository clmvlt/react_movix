import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AccountSaveBarProps {
  dirty: boolean;
  pending: boolean;
  saveDisabled?: boolean;
  onSave: () => void;
  onReset: () => void;
}

export function AccountSaveBar({
  dirty,
  pending,
  saveDisabled = false,
  onSave,
  onReset,
}: AccountSaveBarProps) {
  const { t } = useTranslation();

  return (
    <div className="sticky bottom-0 z-10 -mx-4 flex items-center gap-2 border-t border-border bg-card/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:justify-end lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
      <Button
        type="button"
        variant="outline"
        className="min-h-11 flex-1 lg:min-h-10 lg:flex-none"
        disabled={!dirty || pending}
        onClick={onReset}
      >
        {t("account.form.reset")}
      </Button>
      <Button
        type="button"
        className="min-h-11 flex-1 lg:min-h-10 lg:flex-none"
        disabled={!dirty || pending || saveDisabled}
        onClick={onSave}
      >
        {pending && <Loader2 className="size-4 animate-spin" />}
        {t("common.save")}
      </Button>
    </div>
  );
}
