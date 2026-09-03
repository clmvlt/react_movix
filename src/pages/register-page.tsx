import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/app/toast-context";
import { DateField } from "@/components/date-field";
import { FormField } from "@/components/form-field";
import { GoogleAuthButton } from "@/components/google-auth-button";
import { RegistrationPendingCard } from "@/components/auth/registration-pending";
import { ApiError, apiErrorText } from "@/lib/api-error";
import { clearSession } from "@/lib/auth";
import {
  clearAuthRedirect,
  resolveAuthRedirect,
  saveAuthRedirect,
} from "@/lib/auth-redirect";
import { usePageSeo } from "@/lib/seo";
import { dateToApiDate } from "@/lib/date";
import {
  authKeys,
  canAccessWeb,
  useGoogleLogin,
  useRegister,
  type ProfilAuth,
  type RegisterInput,
  type RegistrationPending,
} from "@/features/auth";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 8;
const TERMS_FIELD = "acceptedTerms";
const TERMS_ID = "reg-terms";

interface GoogleError {
  message: string;
  loginLink?: boolean;
}

export function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const register = useRegister();
  const googleLogin = useGoogleLogin();
  const toast = useToast();

  usePageSeo({
    title: t("auth.register.documentTitle"),
    description: t("auth.register.metaDescription"),
    path: "/register",
  });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [googleError, setGoogleError] = useState<GoogleError | null>(null);
  const [pending, setPending] = useState<RegistrationPending | null>(null);

  const redirectTo = resolveAuthRedirect(location.state);

  const completeAuth = (profil: ProfilAuth) => {
    if (!canAccessWeb(profil)) {
      clearSession();
      queryClient.removeQueries({ queryKey: authKeys.all });
      toast.error(t("auth.login.webOnly"));
      return;
    }
    clearAuthRedirect();
    navigate(redirectTo, { replace: true });
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setGoogleError(null);

    const errors: Record<string, string> = {};
    const trimmedEmail = email.trim();
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      errors.email = t("account.me.errors.emailInvalid");
    }
    if (password.length < PASSWORD_MIN_LENGTH) {
      errors.password = t("auth.register.passwordTooShort", {
        count: PASSWORD_MIN_LENGTH,
      });
    }
    if (confirmPassword !== password) {
      errors.confirmPassword = t("auth.reset.mismatch");
    }
    if (!acceptedTerms) {
      errors[TERMS_FIELD] = t("terms.required");
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const input: RegisterInput = {
      email: trimmedEmail,
      password,
      acceptedTerms: true,
    };
    if (firstName.trim()) input.firstName = firstName.trim();
    if (lastName.trim()) input.lastName = lastName.trim();
    if (birthday) input.birthday = birthday;

    register.mutate(input, {
      onSuccess: (result) => {
        saveAuthRedirect(redirectTo);
        setPending(result);
      },
      onError: (err) => {
        if (err instanceof ApiError && err.isTermsNotAccepted) {
          setFieldErrors({ [TERMS_FIELD]: t("terms.required") });
        } else if (err instanceof ApiError && err.status === 409) {
          setFieldErrors({ email: t("auth.register.emailUsed") });
        } else if (err instanceof ApiError && err.status === 429) {
          toast.error(t("auth.register.rateLimited"));
        } else if (err instanceof ApiError) {
          const fields = err.fieldErrors;
          if (Object.keys(fields).length > 0) setFieldErrors(fields);
          else toast.error(err.message || t("common.error"));
        } else {
          toast.error(t("common.error"));
        }
      },
    });
  };

  const requireTerms = () => {
    if (acceptedTerms) return true;
    setFieldErrors((prev) => ({ ...prev, [TERMS_FIELD]: t("terms.required") }));
    document.getElementById(TERMS_ID)?.focus();
    return false;
  };

  const handleGoogleCredential = (idToken: string) => {
    setGoogleError(null);
    if (!requireTerms()) return;
    googleLogin.mutate(
      { idToken, acceptedTerms: true },
      {
        onSuccess: completeAuth,
        onError: (err) => {
          if (err instanceof ApiError && err.isTermsNotAccepted) {
            setFieldErrors((prev) => ({
              ...prev,
              [TERMS_FIELD]: t("terms.required"),
            }));
          } else if (err instanceof ApiError && err.errorCode === "GOOGLE_NO_PROFILE") {
            setGoogleError({ message: t("auth.login.googleNoProfile") });
          } else if (err instanceof ApiError && err.isGoogleEmailUsed) {
            setGoogleError({
              message: t("auth.register.googleEmailUsed"),
              loginLink: true,
            });
          } else if (err instanceof ApiError && err.status === 401) {
            toast.error(t("auth.login.googleFailed"));
          } else {
            toast.error(apiErrorText(err) ?? t("common.error"));
          }
        },
      }
    );
  };

  const set =
    (setter: (value: string) => void, key: string) => (value: string) => {
      setter(value);
      setFieldErrors((prev) => ({ ...prev, [key]: "" }));
    };

  if (pending) {
    return (
      <RegistrationPendingCard
        key={pending.email}
        pending={pending}
        onRestart={() => setPending(null)}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{t("auth.register.title")}</CardTitle>
        <CardDescription>{t("auth.register.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-1" noValidate>
          <FormField
            label={t("auth.login.email")}
            htmlFor="reg-email"
            error={fieldErrors.email}
            required
          >
            <Input
              id="reg-email"
              type="email"
              value={email}
              onChange={(e) => set(setEmail, "email")(e.target.value)}
              placeholder={t("auth.login.emailPlaceholder")}
              autoComplete="email"
              autoFocus
              required
            />
          </FormField>

          <FormField
            label={t("auth.login.password")}
            htmlFor="reg-password"
            error={fieldErrors.password}
            hint={t("auth.register.passwordHint", {
              count: PASSWORD_MIN_LENGTH,
            })}
            required
          >
            <Input
              id="reg-password"
              type="password"
              value={password}
              onChange={(e) => set(setPassword, "password")(e.target.value)}
              autoComplete="new-password"
              required
            />
          </FormField>

          <FormField
            label={t("auth.reset.confirmPassword")}
            htmlFor="reg-confirm"
            error={fieldErrors.confirmPassword}
            required
          >
            <Input
              id="reg-confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) =>
                set(setConfirmPassword, "confirmPassword")(e.target.value)
              }
              autoComplete="new-password"
              required
            />
          </FormField>

          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <FormField
              label={t("common.firstName")}
              htmlFor="reg-firstName"
              error={fieldErrors.firstName}
            >
              <Input
                id="reg-firstName"
                value={firstName}
                onChange={(e) => set(setFirstName, "firstName")(e.target.value)}
                autoComplete="given-name"
              />
            </FormField>
            <FormField
              label={t("common.lastName")}
              htmlFor="reg-lastName"
              error={fieldErrors.lastName}
            >
              <Input
                id="reg-lastName"
                value={lastName}
                onChange={(e) => set(setLastName, "lastName")(e.target.value)}
                autoComplete="family-name"
              />
            </FormField>
          </div>

          <FormField
            label={t("account.me.birthday")}
            htmlFor="reg-birthday"
            error={fieldErrors.birthday}
          >
            <DateField
              id="reg-birthday"
              value={birthday}
              onChange={(value) => {
                setBirthday(value);
                setFieldErrors((prev) => ({ ...prev, birthday: "" }));
              }}
              max={dateToApiDate(new Date())}
              aria-label={t("account.me.birthday")}
            />
          </FormField>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-start gap-3">
              <Checkbox
                id={TERMS_ID}
                checked={acceptedTerms}
                onCheckedChange={(value) => {
                  setAcceptedTerms(value === true);
                  setFieldErrors((prev) => ({ ...prev, [TERMS_FIELD]: "" }));
                }}
                aria-required
                aria-invalid={fieldErrors[TERMS_FIELD] ? true : undefined}
                aria-describedby={`${TERMS_ID}-message`}
                className="mt-0.5"
              />
              <Label
                htmlFor={TERMS_ID}
                className="cursor-pointer text-sm font-normal leading-5"
              >
                <Trans
                  i18nKey="terms.acceptLabel"
                  components={{
                    terms: (
                      <Link
                        to="/legal/terms"
                        target="_blank"
                        rel="noopener"
                        className="font-medium text-primary underline-offset-4 hover:underline"
                      />
                    ),
                    privacy: (
                      <Link
                        to="/legal/privacy"
                        target="_blank"
                        rel="noopener"
                        className="font-medium text-primary underline-offset-4 hover:underline"
                      />
                    ),
                  }}
                />
                <span className="ml-0.5 text-destructive">*</span>
              </Label>
            </div>
            <p
              id={`${TERMS_ID}-message`}
              role={fieldErrors[TERMS_FIELD] ? "alert" : undefined}
              className="min-h-4 text-xs leading-4 text-destructive"
            >
              {fieldErrors[TERMS_FIELD] || ""}
            </p>
          </div>

          <Button
            type="submit"
            className="mt-2 w-full"
            disabled={register.isPending}
          >
            {register.isPending && <Loader2 className="size-4 animate-spin" />}
            {register.isPending
              ? t("auth.register.submitting")
              : t("auth.register.submit")}
          </Button>

          <div className="mt-2 text-center text-sm text-muted-foreground">
            {t("auth.register.haveAccount")}{" "}
            <Link
              to="/login"
              state={location.state}
              className="text-primary hover:underline"
            >
              {t("auth.register.signIn")}
            </Link>
          </div>
        </form>

        <GoogleAuthButton
          className="mt-4"
          text="continue_with"
          onCredential={handleGoogleCredential}
          busy={googleLogin.isPending}
          gate={{
            blocked: !acceptedTerms,
            onBlocked: requireTerms,
            label: t("terms.googleBlocked"),
          }}
          before={
            <div className="mb-4 flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="text-xs uppercase text-muted-foreground">
                {t("auth.login.or")}
              </span>
              <span className="h-px flex-1 bg-border" />
            </div>
          }
        />
        {googleError && (
          <Alert variant="destructive" className="mt-3">
            <AlertDescription>
              {googleError.message}
              {googleError.loginLink && (
                <Link
                  to="/login"
                  state={location.state}
                  className="mt-1 block font-medium underline underline-offset-4"
                >
                  {t("auth.register.signIn")}
                </Link>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
