import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FormField } from "@/components/form-field";
import { useForgotPassword } from "@/features/profiles";

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const forgot = useForgotPassword();
  const [email, setEmail] = useState("");

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    forgot.mutate({ email });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{t("auth.forgot.title")}</CardTitle>
        <CardDescription>{t("auth.forgot.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        {forgot.isSuccess ? (
          <div className="flex flex-col gap-4">
            <Alert variant="success">
              <CheckCircle2 />
              <AlertDescription>{t("auth.forgot.done")}</AlertDescription>
            </Alert>
            <Button asChild variant="outline" className="w-full">
              <Link to="/login">{t("auth.forgot.backToLogin")}</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-1" noValidate>
            <FormField label={t("common.email")} htmlFor="email" required>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
                required
              />
            </FormField>
            <Button
              type="submit"
              className="mt-2 w-full"
              disabled={forgot.isPending}
            >
              {forgot.isPending && <Loader2 className="size-4 animate-spin" />}
              {forgot.isPending
                ? t("auth.forgot.submitting")
                : t("auth.forgot.submit")}
            </Button>
            <div className="mt-3 text-center">
              <Link to="/login" className="text-sm text-primary hover:underline">
                {t("auth.forgot.backToLogin")}
              </Link>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
