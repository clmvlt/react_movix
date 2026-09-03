import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, Loader2, Send } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FormField } from "@/components/form-field";
import { useToast } from "@/app/toast-context";
import { useTestEmail } from "@/features/account";
import { smtpPortHint, type AccountTabProps } from "./account-form";
import { useApiErrorMessage } from "./use-account-error";

export function AccountSmtpTab({
  form,
  errors,
  set,
  disabled,
}: AccountTabProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const testEmail = useTestEmail();
  const errorMessage = useApiErrorMessage("account");
  const [revealed, setRevealed] = useState(false);

  const portHint = smtpPortHint(form);

  const runTest = () => {
    testEmail.mutate(undefined, {
      onSuccess: (result) => {
        if (result.status === "SUCCESS") toast.success(result.message);
        else toast.error(result.message);
      },
      onError: (error) => {
        toast.error(errorMessage(error, "account.smtp.testError"));
      },
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("account.smtp.title")}</CardTitle>
          <CardDescription>{t("account.smtp.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex min-h-11 items-center gap-3">
            <Checkbox
              id="smtpEnable"
              className="size-5"
              checked={form.smtpEnable}
              onCheckedChange={(value) => set("smtpEnable", value === true)}
              disabled={disabled}
            />
            <Label htmlFor="smtpEnable" className="cursor-pointer">
              {t("account.smtp.enable")}
            </Label>
          </div>
          <p className="text-xs leading-4 text-muted-foreground">
            {t("account.smtp.enableHint")}
          </p>

          {!form.smtpEnable && (
            <Alert>
              <AlertDescription>
                {t("account.smtp.disabledNotice")}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <FormField
              label={t("account.smtp.host")}
              htmlFor="smtpHost"
              error={errors.smtpHost}
              required={form.smtpEnable}
            >
              <Input
                id="smtpHost"
                value={form.smtpHost}
                onChange={(e) => set("smtpHost", e.target.value)}
                disabled={disabled}
                autoComplete="off"
              />
            </FormField>
            <FormField
              label={t("account.smtp.port")}
              htmlFor="smtpPort"
              error={errors.smtpPort}
              hint={portHint ? t(portHint) : undefined}
              required={form.smtpEnable}
            >
              <Input
                id="smtpPort"
                inputMode="numeric"
                value={form.smtpPort}
                onChange={(e) => set("smtpPort", e.target.value)}
                disabled={disabled}
                autoComplete="off"
              />
            </FormField>
            <FormField
              label={t("account.smtp.username")}
              htmlFor="smtpUsername"
              error={errors.smtpUsername}
            >
              <Input
                id="smtpUsername"
                value={form.smtpUsername}
                onChange={(e) => set("smtpUsername", e.target.value)}
                disabled={disabled}
                autoComplete="off"
              />
            </FormField>
            <FormField
              label={t("account.smtp.password")}
              htmlFor="smtpPassword"
              error={errors.smtpPassword}
            >
              <div className="flex items-center gap-2">
                <Input
                  id="smtpPassword"
                  type={revealed ? "text" : "password"}
                  value={form.smtpPassword}
                  onChange={(e) => set("smtpPassword", e.target.value)}
                  disabled={disabled}
                  autoComplete="new-password"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-11 shrink-0 lg:size-10"
                  aria-label={
                    revealed
                      ? t("account.smtp.hidePassword")
                      : t("account.smtp.showPassword")
                  }
                  onClick={() => setRevealed((previous) => !previous)}
                >
                  {revealed ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </Button>
              </div>
            </FormField>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex min-h-11 items-center gap-3">
              <Checkbox
                id="smtpUseTls"
                className="size-5"
                checked={form.smtpUseTls}
                onCheckedChange={(value) => set("smtpUseTls", value === true)}
                disabled={disabled}
              />
              <Label htmlFor="smtpUseTls" className="cursor-pointer">
                {t("account.smtp.useTls")}
              </Label>
            </div>
            <div className="flex min-h-11 items-center gap-3">
              <Checkbox
                id="smtpUseSsl"
                className="size-5"
                checked={form.smtpUseSsl}
                onCheckedChange={(value) => set("smtpUseSsl", value === true)}
                disabled={disabled}
              />
              <Label htmlFor="smtpUseSsl" className="cursor-pointer">
                {t("account.smtp.useSsl")}
              </Label>
            </div>
            {errors.smtpUseTls && (
              <p className="text-xs leading-4 text-destructive">
                {errors.smtpUseTls}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("account.smtp.test")}</CardTitle>
          <CardDescription>{t("account.smtp.testHint")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button
            type="button"
            variant="outline"
            className="min-h-11 w-full lg:min-h-10 lg:w-auto lg:self-start"
            disabled={testEmail.isPending}
            onClick={runTest}
          >
            {testEmail.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            {testEmail.isPending
              ? t("account.smtp.testing")
              : t("account.smtp.test")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
