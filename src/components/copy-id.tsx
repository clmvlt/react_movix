import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { copyText } from "@/lib/clipboard";
import { useToast } from "@/app/toast-context";

interface CopyIdProps {
  value: string;
}

export function CopyId({ value }: CopyIdProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (await copyText(value)) {
      setCopied(true);
      toast.success(t("common.idCopied"));
      window.setTimeout(() => setCopied(false), 1500);
    } else {
      setCopied(false);
      toast.error(t("common.copyFailed"));
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      className="min-h-10 justify-start gap-1.5 px-2 font-normal tabular-nums text-muted-foreground lg:min-h-9"
      title={copied ? t("common.idCopied") : t("common.copyId")}
      aria-label={copied ? t("common.idCopied") : t("common.copyId")}
      onClick={() => void copy()}
    >
      {copied ? (
        <Check className="size-3.5 shrink-0" />
      ) : (
        <Copy className="size-3.5 shrink-0" />
      )}
      <span className="truncate text-xs">{value.slice(0, 8)}</span>
    </Button>
  );
}
