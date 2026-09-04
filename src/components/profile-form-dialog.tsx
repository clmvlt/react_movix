import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Globe, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/app/toast-context";
import { FormField } from "@/components/form-field";
import { useIsAdmin } from "@/components/admin-gate";
import { PasswordOwnedNotice } from "@/components/profiles/password-owned-notice";
import { ApiError, apiErrorText } from "@/lib/api-error";
import type { Profil } from "@/features/auth";
import {
  useCreateProfile,
  useUpdateProfile,
  type ProfilCreateInput,
} from "@/features/profiles";

interface ProfileFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Profil | null;
  onGrantWeb?: (profile: Profil) => void;
}

interface FormState {
  identifiant: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  isWeb: boolean;
  isMobile: boolean;
  isAdmin: boolean;
  isActive: boolean;
}

function initialState(profile: Profil | null): FormState {
  return {
    identifiant: profile?.identifiant ?? "",
    firstName: profile?.firstName ?? "",
    lastName: profile?.lastName ?? "",
    email: profile?.email ?? "",
    password: "",
    isWeb: profile?.isWeb ?? false,
    isMobile: profile?.isMobile ?? false,
    isAdmin: profile?.isAdmin ?? false,
    isActive: profile?.isActive ?? true,
  };
}

export function ProfileFormDialog({
  open,
  onOpenChange,
  profile,
  onGrantWeb,
}: ProfileFormDialogProps) {
  const { t } = useTranslation();
  const isAdmin = useIsAdmin();
  const isEdit = Boolean(profile);
  const linkedUser = Boolean(profile?.userId);
  const webEditable = isAdmin && linkedUser;
  const canGrantWeb =
    isAdmin && isEdit && !linkedUser && profile?.isWeb !== true;
  const createProfile = useCreateProfile();
  const updateProfile = useUpdateProfile();
  const toast = useToast();

  const [form, setForm] = useState<FormState>(() => initialState(profile));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setForm(initialState(profile));
      setFieldErrors({});
    }
  }, [open, profile]);

  const pending = createProfile.isPending || updateProfile.isPending;
  const showEmail = form.isWeb || linkedUser;
  const ownsPassword = isEdit && (linkedUser || profile?.isWeb === true);

  const passwordLabel = isEdit
    ? t("profiles.form.passwordEdit")
    : t("profiles.form.passwordCreate");

  const passwordHint = isEdit
    ? t("profiles.form.passwordHint")
    : t("profiles.form.passwordCreateHint");

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setFieldErrors({});

    if (form.isWeb && !linkedUser && !form.email.trim()) {
      setFieldErrors({ email: t("profiles.form.emailRequiredWeb") });
      return;
    }

    let isWeb: boolean | undefined = form.isWeb;
    if (!webEditable) isWeb = isEdit ? undefined : false;

    const base: ProfilCreateInput = {
      identifiant: form.identifiant.trim() || undefined,
      firstName: form.firstName.trim() || undefined,
      lastName: form.lastName.trim() || undefined,
      email:
        linkedUser || !form.isWeb ? undefined : form.email.trim() || undefined,
      isWeb,
      isMobile: form.isMobile,
      isAdmin: form.isAdmin,
      isActive: form.isActive,
    };

    const onError = (err: unknown) => {
      if (err instanceof ApiError) {
        const fields = err.fieldErrors;
        if (Object.keys(fields).length > 0) setFieldErrors(fields);
        else if (err.status === 403) {
          toast.error(apiErrorText(err) ?? t("profiles.password.ownedByUser"));
        } else if (err.status === 409) {
          const message = err.message || t("profiles.form.conflict");
          const lower = message.toLowerCase();
          const identifiantConflict =
            lower.includes("identifiant") || lower.includes("username");
          if (identifiantConflict) {
            setFieldErrors({ identifiant: message });
          } else if (lower.includes("email")) {
            setFieldErrors({ email: message });
          } else toast.error(t("profiles.form.conflict"));
        } else toast.error(err.message || t("common.error"));
      } else {
        toast.error(t("common.error"));
      }
    };

    if (isEdit && profile) {
      updateProfile.mutate(
        {
          id: profile.id,
          input:
            !ownsPassword && form.password
              ? { ...base, password: form.password }
              : base,
        },
        { onSuccess: () => onOpenChange(false), onError }
      );
    } else {
      createProfile.mutate(
        { ...base, password: form.password || undefined },
        {
          onSuccess: (created) => {
            onOpenChange(false);
            if (created?.userId) {
              toast.success(t("profiles.form.attachedExisting"));
            }
          },
          onError,
        }
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("profiles.form.editTitle") : t("profiles.form.createTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("profiles.form.subtitleMobile")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-1" noValidate>
          {linkedUser && (
            <div className="mb-2 flex flex-col gap-1.5 rounded-xl border border-border bg-muted/50 p-3">
              <Badge variant="secondary" className="w-fit">
                {t("profiles.form.linkedBadge")}
              </Badge>
              <p className="text-xs leading-4 text-muted-foreground">
                {t("profiles.form.linkedHint")}
              </p>
            </div>
          )}

          <FormField
            label={t("profiles.form.identifiant")}
            htmlFor="pf-identifiant"
            error={fieldErrors.identifiant}
          >
            <Input
              id="pf-identifiant"
              value={form.identifiant}
              onChange={(e) => set("identifiant", e.target.value)}
              autoComplete="off"
              className="min-h-11 lg:min-h-10"
            />
          </FormField>

          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <FormField
              label={t("profiles.form.firstName")}
              htmlFor="pf-firstName"
            >
              <Input
                id="pf-firstName"
                value={form.firstName}
                onChange={(e) => set("firstName", e.target.value)}
                className="min-h-11 lg:min-h-10"
              />
            </FormField>
            <FormField label={t("profiles.form.lastName")} htmlFor="pf-lastName">
              <Input
                id="pf-lastName"
                value={form.lastName}
                onChange={(e) => set("lastName", e.target.value)}
                className="min-h-11 lg:min-h-10"
              />
            </FormField>
          </div>

          {showEmail && (
            <FormField
              label={t("common.email")}
              htmlFor="pf-email"
              error={fieldErrors.email}
              required={form.isWeb && !linkedUser}
              hint={linkedUser ? t("profiles.form.emailLinkedHint") : undefined}
            >
              <Input
                id="pf-email"
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                autoComplete="off"
                className="min-h-11 lg:min-h-10"
                disabled={linkedUser}
              />
            </FormField>
          )}

          {ownsPassword ? (
            <PasswordOwnedNotice email={profile?.email} className="mb-2" />
          ) : (
            <FormField
              label={passwordLabel}
              htmlFor="pf-password"
              error={fieldErrors.password}
              hint={passwordHint}
            >
              <Input
                id="pf-password"
                type="password"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                autoComplete="new-password"
                className="min-h-11 lg:min-h-10"
              />
            </FormField>
          )}

          <div className="mt-1 grid grid-cols-2 gap-2">
            {(
              [
                ["isWeb", "profiles.access.web"],
                ["isMobile", "profiles.access.mobile"],
                ["isAdmin", "profiles.access.admin"],
                ["isActive", "profiles.access.active"],
              ] as const
            )
              .filter(([key]) => {
                if (key === "isWeb") return webEditable;
                if (key === "isAdmin") return isAdmin;
                return true;
              })
              .map(([key, labelKey]) => (
              <label
                key={key}
                htmlFor={`pf-${key}`}
                className="flex min-h-11 items-center gap-3 rounded-xl border border-border bg-card px-3 py-2 lg:min-h-10"
              >
                <Checkbox
                  id={`pf-${key}`}
                  checked={form[key]}
                  onCheckedChange={(v) => set(key, v === true)}
                />
                <Label htmlFor={`pf-${key}`} className="font-normal">
                  {t(labelKey)}
                </Label>
              </label>
            ))}
          </div>

          {canGrantWeb && (
            <div className="mt-2 flex flex-col gap-2 rounded-xl border border-border bg-muted/50 p-3">
              <p className="text-xs leading-4 text-muted-foreground">
                {t("profiles.grantWeb.formHint")}
              </p>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 w-full sm:w-fit lg:min-h-10"
                onClick={() => {
                  onOpenChange(false);
                  if (profile) onGrantWeb?.(profile);
                }}
              >
                <Globe className="size-4" />
                {t("profiles.grantWeb.action")}
              </Button>
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              className="min-h-11 sm:min-h-10"
              onClick={() => onOpenChange(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              className="min-h-11 sm:min-h-10"
              disabled={pending}
            >
              {pending && <Loader2 className="size-4 animate-spin" />}
              {t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
