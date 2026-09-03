import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { AccountTabProps } from "./account-form";

export function AccountEmailsTab({ form, set, disabled }: AccountTabProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("account.emails.title")}</CardTitle>
        <CardDescription>{t("account.emails.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="flex min-h-11 items-center gap-3">
          <Checkbox
            id="autoSendAnomalieEmails"
            className="size-5"
            checked={form.autoSendAnomalieEmails}
            onCheckedChange={(value) =>
              set("autoSendAnomalieEmails", value === true)
            }
            disabled={disabled}
          />
          <Label htmlFor="autoSendAnomalieEmails" className="cursor-pointer">
            {t("account.emails.autoSend")}
          </Label>
        </div>
        <p className="text-xs leading-4 text-muted-foreground">
          {t("account.emails.autoSendHint")}
        </p>
      </CardContent>
    </Card>
  );
}
