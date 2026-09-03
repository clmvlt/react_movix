import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/app/toast-context";
import { FormField } from "@/components/form-field";
import { useIsHyperadmin } from "@/components/admin-gate";
import { AccountPicker } from "@/components/hyperadmin/account-picker";
import { useTokenError } from "@/components/api-tokens/use-token-error";
import type { Account } from "@/features/auth";
import {
  TOKEN_DESCRIPTION_MAX,
  TOKEN_NAME_MAX,
  useCreateImporterToken,
  useUpdateImporterToken,
  type ImporterToken,
  type ImporterTokenUpdateInput,
} from "@/features/importer-tokens";

interface TokenFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: ImporterToken | null;
  onCreated?: (token: ImporterToken) => void;
}

interface FormState {
  name: string;
  description: string;
  isActive: boolean;
  isBetaProxy: boolean;
  account: Account | null;
}

function initialForm(token: ImporterToken | null): FormState {
  return {
    name: token?.name ?? "",
    description: token?.description ?? "",
    isActive: token?.isActive ?? true,
    isBetaProxy: token?.isBetaProxy ?? false,
    account: null,
  };
}

export function TokenFormDialog({
  open,
  onOpenChange,
  token,
  onCreated,
}: TokenFormDialogProps) {
  const { t } = useTranslation();
  const createToken = useCreateImporterToken();
  const updateToken = useUpdateImporterToken();
  const errorMessage = useTokenError();
  const isHyperadmin = useIsHyperadmin();
  const toast = useToast();

  const [form, setForm] = useState<FormState>(() => initialForm(null));
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setForm(initialForm(token));
    setErrors({});
  }, [open, token]);

  const isEdit = Boolean(token);
  const pending = createToken.isPending || updateToken.isPending;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: "" }));
  };

  const validate = (): Record<string, string> => {
    const next: Record<string, string> = {};
    const name = form.name.trim();
    if (!name) next.name = t("common.required");
    else if (name.length > TOKEN_NAME_MAX) {
      next.name = t("apiTokens.form.nameTooLong", { max: TOKEN_NAME_MAX });
    }
    if (form.description.trim().length > TOKEN_DESCRIPTION_MAX) {
      next.description = t("apiTokens.form.descriptionTooLong", {
        max: TOKEN_DESCRIPTION_MAX,
      });
    }
    return next;
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const onError = (error: unknown) => {
      toast.error(
        errorMessage(
          error,
          isEdit ? "apiTokens.errors.saveFailed" : "apiTokens.errors.createFailed"
        )
      );
    };

    if (token) {
      const patch: ImporterTokenUpdateInput = {};
      if (form.name.trim() !== token.name) patch.name = form.name;
      if (form.description.trim() !== (token.description ?? "").trim()) {
        patch.description = form.description;
      }
      if (form.isActive !== token.isActive) patch.isActive = form.isActive;
      if (isHyperadmin && form.isBetaProxy !== token.isBetaProxy) {
        patch.isBetaProxy = form.isBetaProxy;
      }

      if (Object.keys(patch).length === 0) {
        onOpenChange(false);
        return;
      }

      updateToken.mutate(
        { id: token.id, input: patch },
        { onSuccess: () => onOpenChange(false), onError }
      );
      return;
    }

    createToken.mutate(
      {
        name: form.name,
        description: form.description,
        ...(isHyperadmin
          ? {
              isBetaProxy: form.isBetaProxy,
              accountId: form.account?.id,
            }
          : {}),
      },
      {
        onSuccess: (created) => {
          onOpenChange(false);
          onCreated?.(created);
        },
        onError,
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? t("apiTokens.form.editTitle")
              : t("apiTokens.form.createTitle")}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? t("apiTokens.form.editSubtitle")
              : t("apiTokens.form.createSubtitle")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-1" noValidate>
          <FormField
            label={t("common.name")}
            htmlFor="token-name"
            error={errors.name}
            hint={t("apiTokens.form.nameHint")}
            required
          >
            <Input
              id="token-name"
              value={form.name}
              onChange={(event) => set("name", event.target.value)}
              maxLength={TOKEN_NAME_MAX}
              autoComplete="off"
              className="min-h-11 lg:min-h-10"
            />
          </FormField>

          <FormField
            label={t("apiTokens.columns.description")}
            htmlFor="token-description"
            error={errors.description}
            hint={t("apiTokens.form.descriptionHint")}
          >
            <Textarea
              id="token-description"
              value={form.description}
              onChange={(event) => set("description", event.target.value)}
              maxLength={TOKEN_DESCRIPTION_MAX}
              rows={3}
            />
          </FormField>

          {isHyperadmin && !isEdit && (
            <FormField
              label={t("apiTokens.form.account")}
              htmlFor="token-account"
              hint={t("apiTokens.form.accountHint")}
            >
              <AccountPicker
                id="token-account"
                value={form.account}
                onChange={(account) => set("account", account)}
              />
            </FormField>
          )}

          {isHyperadmin && (
            <div className="mb-2 flex items-start gap-3 rounded-xl border border-border bg-card p-3">
              <Checkbox
                id="token-beta-proxy"
                checked={form.isBetaProxy}
                onCheckedChange={(checked) =>
                  set("isBetaProxy", checked === true)
                }
                className="mt-0.5"
              />
              <div className="min-w-0">
                <Label htmlFor="token-beta-proxy">
                  {t("apiTokens.form.betaProxy")}
                </Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("apiTokens.form.betaProxyHint")}
                </p>
              </div>
            </div>
          )}

          {isEdit && (
            <div className="mb-2 flex items-start gap-3 rounded-xl border border-border bg-card p-3">
              <Checkbox
                id="token-active"
                checked={form.isActive}
                onCheckedChange={(checked) => set("isActive", checked === true)}
                className="mt-0.5"
              />
              <div className="min-w-0">
                <Label htmlFor="token-active">{t("apiTokens.form.active")}</Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("apiTokens.form.activeHint")}
                </p>
              </div>
            </div>
          )}

          {!isEdit && (
            <Alert variant="warning" className="mb-2">
              <AlertDescription>{t("apiTokens.form.createNotice")}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 sm:min-h-10"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              className="min-h-11 sm:min-h-10"
              disabled={pending}
            >
              {pending && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? t("common.save") : t("common.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
