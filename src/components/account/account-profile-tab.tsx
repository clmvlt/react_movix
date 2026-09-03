import { useRef, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, MailCheck } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateField } from "@/components/date-field";
import { DetailField } from "@/components/detail-field";
import { FormField } from "@/components/form-field";
import { GoogleAuthButton } from "@/components/google-auth-button";
import { InitialsImage } from "@/components/initials-image";
import { StatusBadge } from "@/components/status-badge";
import { ApiError, apiErrorText } from "@/lib/api-error";
import { emitUnauthorized } from "@/lib/auth";
import { dateToApiDate } from "@/lib/date";
import { profilPictureUrl } from "@/lib/images";
import { initialsFromName } from "@/lib/initials";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { useAuth } from "@/app/auth-context";
import { useToast } from "@/app/toast-context";
import { authKeys, type ProfilAuth } from "@/features/auth";
import {
  PROFIL_PICTURE_INPUT_MAX_BYTES,
  profilPictureTooLarge,
  toProfilPictureDataUrl,
  useChangePassword,
  useEmailAvailability,
  useLinkGoogle,
  useResendVerification,
  useUnlinkGoogle,
  useUpdateMyProfil,
  type ProfilSelfUpdateInput,
} from "@/features/profiles";

interface InfoFormState {
  firstName: string;
  lastName: string;
  birthday: string;
  email: string;
}

function initialInfoForm(user: ProfilAuth | null): InfoFormState {
  return {
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    birthday: user?.birthday ?? "",
    email: user?.email ?? "",
  };
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ProfilePhotoCard() {
  const { t } = useTranslation();
  const { user, accounts } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const updatePhoto = useUpdateMyProfil();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);

  const pending = busy || updatePhoto.isPending;
  const companyless = Boolean(user?.userId) && accounts.length === 0;

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(t("account.me.photo.notImage"));
      return;
    }
    if (file.size > PROFIL_PICTURE_INPUT_MAX_BYTES) {
      toast.error(t("account.me.photo.tooLarge"));
      return;
    }
    setBusy(true);
    try {
      const dataUrl = await toProfilPictureDataUrl(file);
      if (profilPictureTooLarge(dataUrl)) {
        toast.error(t("account.me.photo.tooLarge"));
        return;
      }
      updatePhoto.mutate(
        { profilPicture: dataUrl },
        {
          onSuccess: (fresh) => {
            queryClient.setQueryData<ProfilAuth>(authKeys.me(), (prev) =>
              prev ? { ...prev, ...fresh } : prev
            );
            toast.success(t("account.me.photo.updated"));
          },
          onError: (err) => {
            toast.error(
              err instanceof ApiError && err.message
                ? err.message
                : t("common.error")
            );
          },
        }
      );
    } catch {
      toast.error(t("account.me.photo.notImage"));
    } finally {
      setBusy(false);
    }
  };

  if (companyless) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {t("account.me.photo.title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <InitialsImage
              src={profilPictureUrl(user?.profilPicture)}
              initials={initialsFromName(
                user?.firstName,
                user?.lastName,
                user?.identifiant
              )}
              alt={t("account.me.photo.title")}
              className="size-20 rounded-full border border-border object-cover"
              fallbackClassName="bg-accent text-lg font-medium text-accent-foreground"
            />
            {pending && (
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-background/70">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </span>
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              className="min-h-11 w-full lg:min-h-10 lg:w-auto"
              disabled={pending}
              onClick={() => inputRef.current?.click()}
            >
              {t("account.me.photo.change")}
            </Button>
            <p className="text-xs leading-4 text-muted-foreground">
              {t("account.me.photo.hint")}
            </p>
            {accounts.length > 1 && (
              <p className="text-xs leading-4 text-muted-foreground">
                {t("account.me.photo.perCompanyHint", {
                  company: user?.account?.societe ?? "",
                })}
              </p>
            )}
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            void handleFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
      </CardContent>
    </Card>
  );
}

function ProfileInfoCard() {
  const { t } = useTranslation();
  const { user, accounts } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const updateProfil = useUpdateMyProfil();
  const resendVerification = useResendVerification();

  const [form, setForm] = useState<InfoFormState>(() => initialInfoForm(user));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [syncedUserId, setSyncedUserId] = useState(user?.id);

  if (user?.id !== syncedUserId) {
    setSyncedUserId(user?.id);
    setForm(initialInfoForm(user));
  }

  const set = <K extends keyof InfoFormState>(
    key: K,
    value: InfoFormState[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const baseline = initialInfoForm(user);
  const dirty = (Object.keys(baseline) as (keyof InfoFormState)[]).some(
    (key) => form[key].trim() !== baseline[key]
  );

  const emailDraft = form.email.trim();
  const emailChanged =
    emailDraft.toLowerCase() !== (user?.email ?? "").toLowerCase();
  const debouncedEmail = useDebouncedValue(emailDraft, 400);
  const emailCheck = useEmailAvailability(
    debouncedEmail,
    emailChanged &&
      debouncedEmail === emailDraft &&
      EMAIL_PATTERN.test(debouncedEmail)
  );
  const emailTaken = emailChanged && emailCheck.data?.isUsed === true;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const errors: Record<string, string> = {};
    const patch: ProfilSelfUpdateInput = {};

    (["firstName", "lastName", "birthday"] as const).forEach((key) => {
      const value = form[key].trim();
      if (value === baseline[key]) return;
      if (!value && baseline[key]) {
        errors[key] = t("account.me.errors.cannotClear");
        return;
      }
      if (value) patch[key] = value;
    });

    if (emailDraft !== baseline.email) {
      if (!emailDraft && baseline.email) {
        errors.email = t("account.me.errors.cannotClear");
      } else if (!EMAIL_PATTERN.test(emailDraft)) {
        errors.email = t("account.me.errors.emailInvalid");
      } else if (emailTaken) {
        errors.email = t("account.me.errors.emailUsed");
      } else {
        patch.email = emailDraft;
      }
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    if (Object.keys(patch).length === 0) {
      toast.warning(t("account.form.noChanges"));
      return;
    }

    const emailUpdated = patch.email !== undefined;
    updateProfil.mutate(patch, {
      onSuccess: (fresh) => {
        queryClient.setQueryData<ProfilAuth>(authKeys.me(), (prev) =>
          prev ? { ...prev, ...fresh } : prev
        );
        setForm({
          firstName: fresh.firstName ?? "",
          lastName: fresh.lastName ?? "",
          birthday: fresh.birthday ?? "",
          email: fresh.email ?? "",
        });
        toast.success(
          emailUpdated
            ? t("account.me.verificationSent")
            : t("account.form.saved")
        );
      },
      onError: (err) => {
        if (err instanceof ApiError && err.status === 409) {
          setFieldErrors({ email: t("account.me.errors.emailUsed") });
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

  const handleResend = () => {
    resendVerification.mutate(undefined, {
      onSuccess: () => toast.success(t("auth.verify.resent")),
      onError: () => toast.error(t("common.error")),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("account.profile")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-1"
          noValidate
        >
          {Boolean(user?.userId) && accounts.length > 1 && (
            <p className="mb-3 text-xs leading-4 text-muted-foreground">
              {t("account.me.sharedIdentityHint")}
            </p>
          )}
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <FormField
              label={t("common.firstName")}
              htmlFor="me-firstName"
              error={fieldErrors.firstName}
            >
              <Input
                id="me-firstName"
                value={form.firstName}
                onChange={(e) => set("firstName", e.target.value)}
                autoComplete="given-name"
              />
            </FormField>
            <FormField
              label={t("common.lastName")}
              htmlFor="me-lastName"
              error={fieldErrors.lastName}
            >
              <Input
                id="me-lastName"
                value={form.lastName}
                onChange={(e) => set("lastName", e.target.value)}
                autoComplete="family-name"
              />
            </FormField>
          </div>

          <FormField
            label={t("account.me.birthday")}
            htmlFor="me-birthday"
            error={fieldErrors.birthday}
          >
            <DateField
              id="me-birthday"
              value={form.birthday}
              onChange={(value) => set("birthday", value)}
              max={dateToApiDate(new Date())}
              aria-label={t("account.me.birthday")}
            />
          </FormField>

          <FormField
            label={t("common.email")}
            htmlFor="me-email"
            error={
              fieldErrors.email ||
              (emailTaken ? t("account.me.errors.emailUsed") : "")
            }
            hint={emailChanged ? t("account.me.emailChangeHint") : undefined}
          >
            <Input
              id="me-email"
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              autoComplete="email"
            />
          </FormField>

          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge
              label={
                user?.isEmailVerified
                  ? t("account.me.emailVerified")
                  : t("account.me.emailNotVerified")
              }
              category={user?.isEmailVerified ? "success" : "warning"}
            />
            {user?.email && !user?.isEmailVerified && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-10"
                disabled={resendVerification.isPending}
                onClick={handleResend}
              >
                {resendVerification.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <MailCheck className="size-4" />
                )}
                {t("auth.verify.resend")}
              </Button>
            )}
          </div>

          {user?.identifiant && (
            <FormField
              label={t("profiles.form.identifiant")}
              htmlFor="me-identifiant"
              hint={t("account.me.identifiantHint")}
            >
              <Input id="me-identifiant" value={user.identifiant} disabled />
            </FormField>
          )}

          {user?.account && (
            <dl className="mb-3">
              <DetailField label={t("account.role")}>
                {user.isAdmin ? t("account.admin") : t("account.member")}
              </DetailField>
            </dl>
          )}

          <Button
            type="submit"
            className="min-h-11 lg:min-h-10"
            disabled={updateProfil.isPending || !dirty}
          >
            {updateProfil.isPending && (
              <Loader2 className="size-4 animate-spin" />
            )}
            {t("common.save")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function PasswordCard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const toast = useToast();
  const changePassword = useChangePassword();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error(t("auth.reset.mismatch"));
      return;
    }
    changePassword.mutate(
      { currentPassword, newPassword, confirmPassword },
      {
        onSuccess: () => {
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
          toast.success(t("account.password.done"));
        },
        onError: (err) => {
          if (err instanceof ApiError && err.status === 401) {
            toast.error(t("account.password.wrongCurrent"));
          } else if (err instanceof ApiError && err.message) {
            toast.error(err.message);
          } else {
            toast.error(t("common.error"));
          }
        },
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {t("account.password.title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-x-4"
          noValidate
        >
          {Boolean(user?.userId) && (
            <p className="mb-3 text-xs leading-4 text-muted-foreground">
              {t("account.password.webOnlyHint")}
            </p>
          )}
          <FormField
            label={t("account.password.current")}
            htmlFor="currentPassword"
            required
          >
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </FormField>
          <FormField
            label={t("account.password.new")}
            htmlFor="newPassword"
            required
          >
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </FormField>
          <FormField
            label={t("account.password.confirm")}
            htmlFor="confirmPassword"
            required
          >
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </FormField>
          <Button
            type="submit"
            className="min-h-11 lg:min-h-10"
            disabled={changePassword.isPending}
          >
            {changePassword.isPending && (
              <Loader2 className="size-4 animate-spin" />
            )}
            {t("account.password.submit")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function GoogleCard() {
  const { t } = useTranslation();
  const { user, accounts } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const linkGoogle = useLinkGoogle();
  const unlinkGoogle = useUnlinkGoogle();

  const handleCredential = (idToken: string) => {
    linkGoogle.mutate(
      { idToken },
      {
        onSuccess: (fresh) => {
          queryClient.setQueryData<ProfilAuth>(authKeys.me(), (prev) =>
            prev ? { ...prev, ...fresh } : prev
          );
          toast.success(t("account.google.linked"));
        },
        onError: (err) => {
          if (err instanceof ApiError && err.status === 409) {
            toast.error(t("account.google.conflict"));
          } else if (
            err instanceof ApiError &&
            err.errorCode === "GOOGLE_INVALID_TOKEN"
          ) {
            toast.error(t("account.google.invalidToken"));
          } else if (err instanceof ApiError && err.status === 401) {
            emitUnauthorized();
          } else {
            toast.error(apiErrorText(err) ?? t("common.error"));
          }
        },
      }
    );
  };

  const handleUnlink = () => {
    unlinkGoogle.mutate(undefined, {
      onSuccess: () => {
        queryClient.setQueryData<ProfilAuth>(authKeys.me(), (prev) =>
          prev ? { ...prev, googleLinked: false, googleEmail: null } : prev
        );
        toast.success(t("account.google.unlinked"));
      },
      onError: (err) => {
        toast.error(apiErrorText(err) ?? t("common.error"));
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("account.google.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        {accounts.length > 1 && (
          <p className="mb-3 text-xs leading-4 text-muted-foreground">
            {t("account.google.identityHint")}
          </p>
        )}
        {user?.googleLinked ? (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge
                label={t("account.google.linkedBadge")}
                category="success"
              />
              <span className="min-w-0 truncate text-sm text-muted-foreground">
                {user.googleEmail}
              </span>
            </div>
            <p className="text-xs leading-4 text-muted-foreground">
              {t("account.google.linkedHint")}
            </p>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 lg:min-h-10 lg:self-start"
              disabled={unlinkGoogle.isPending}
              onClick={handleUnlink}
            >
              {unlinkGoogle.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              {t("account.google.unlink")}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              {t("account.google.hint")}
            </p>
            <GoogleAuthButton
              text="continue_with"
              busy={linkGoogle.isPending}
              onCredential={handleCredential}
              unavailable={
                <p className="text-sm text-muted-foreground">
                  {t("account.google.unavailable")}
                </p>
              }
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function AccountProfileTab() {
  return (
    <div className="grid auto-rows-min grid-cols-1 gap-4 xl:grid-cols-2">
      <div className="flex flex-col gap-4">
        <ProfilePhotoCard />
        <ProfileInfoCard />
      </div>
      <div className="flex flex-col gap-4">
        <PasswordCard />
        <GoogleCard />
      </div>
    </div>
  );
}
