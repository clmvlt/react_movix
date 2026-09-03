import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Copy } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Barcode } from "@/components/barcode";
import { copyText } from "@/lib/clipboard";
import { neutral } from "@/lib/colors";
import { useAuth } from "@/app/auth-context";
import { useToast } from "@/app/toast-context";

export function AccountCodeCard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const toast = useToast();
  const code = user?.account?.code;
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(timer);
  }, [copied]);

  if (!code) return null;

  const copy = async () => {
    if (await copyText(code)) {
      setCopied(true);
      toast.success(t("account.mobileCode.copied"));
    } else {
      setCopied(false);
      toast.error(t("common.copyFailed"));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {t("account.mobileCode.title")}
        </CardTitle>
        <CardDescription>{t("account.mobileCode.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <code className="min-w-0 flex-1 rounded-md bg-muted px-3 py-2 text-center font-mono text-2xl font-semibold tracking-widest text-foreground">
            {code}
          </code>
          <Button
            type="button"
            variant="outline"
            className="min-h-11 shrink-0 lg:min-h-10"
            aria-label={t("account.mobileCode.copy")}
            onClick={() => void copy()}
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {t("account.mobileCode.copy")}
          </Button>
        </div>
        <div
          className="rounded-lg border border-border px-4 py-3"
          style={{ backgroundColor: neutral.white, color: neutral[900] }}
        >
          <Barcode
            value={code}
            className="h-16"
            ariaLabel={`${t("account.mobileCode.title")} ${code}`}
          />
        </div>
      </CardContent>
    </Card>
  );
}
