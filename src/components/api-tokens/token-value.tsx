import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Copy, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { maskToken } from "@/features/importer-tokens";
import { copyText } from "@/lib/clipboard";
import { cn } from "@/lib/utils";
import { useToast } from "@/app/toast-context";

interface TokenValueProps {
  token: string;
  className?: string;
}

export function TokenValue({ token, className }: TokenValueProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(timer);
  }, [copied]);

  useEffect(() => {
    if (!revealed) return;
    const timer = window.setTimeout(() => setRevealed(false), 20_000);
    return () => window.clearTimeout(timer);
  }, [revealed]);

  const copy = async () => {
    if (await copyText(token)) {
      setCopied(true);
      toast.success(t("apiTokens.token.copied"));
    } else {
      setCopied(false);
      toast.error(t("common.copyFailed"));
    }
  };

  return (
    <div className={cn("flex min-w-0 items-center gap-1", className)}>
      <code
        className={cn(
          "min-w-0 flex-1 rounded-md bg-muted px-2 py-1 font-mono text-xs text-foreground",
          revealed ? "break-all" : "truncate tracking-wider"
        )}
      >
        {revealed ? token : maskToken(token)}
      </code>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-11 shrink-0 lg:size-8"
        aria-label={
          revealed ? t("apiTokens.token.hide") : t("apiTokens.token.reveal")
        }
        title={revealed ? t("apiTokens.token.hide") : t("apiTokens.token.reveal")}
        onClick={() => setRevealed((previous) => !previous)}
      >
        {revealed ? (
          <EyeOff className="size-5 lg:size-4" />
        ) : (
          <Eye className="size-5 lg:size-4" />
        )}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-11 shrink-0 lg:size-8"
        aria-label={copied ? t("apiTokens.token.copied") : t("apiTokens.token.copy")}
        title={copied ? t("apiTokens.token.copied") : t("apiTokens.token.copy")}
        onClick={() => void copy()}
      >
        {copied ? (
          <Check className="size-5 lg:size-4" />
        ) : (
          <Copy className="size-5 lg:size-4" />
        )}
      </Button>
    </div>
  );
}
