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
import { FormField } from "@/components/form-field";
import { useToast } from "@/app/toast-context";
import { useApiErrorMessage } from "@/components/account/use-account-error";
import { useCreateTarif, useReplaceTarif, type Tarif } from "@/features/tarifs";
import {
  buildTarifPayload,
  initialTarifForm,
  validateTarifForm,
  type TarifFormState,
} from "./tarif-form";

interface TarifFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tarif: Tarif | null;
  tarifs: Tarif[];
}

export function TarifFormDialog({
  open,
  onOpenChange,
  tarif,
  tarifs,
}: TarifFormDialogProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const createTarif = useCreateTarif();
  const replaceTarif = useReplaceTarif();
  const errorMessage = useApiErrorMessage("tarifs");

  const [form, setForm] = useState<TarifFormState>(() => initialTarifForm(null));
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setForm(initialTarifForm(tarif));
    setErrors({});
  }, [open, tarif]);

  const isEdit = Boolean(tarif);
  const pending = createTarif.isPending || replaceTarif.isPending;

  const set = <K extends keyof TarifFormState>(
    key: K,
    value: TarifFormState[K]
  ) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: "" }));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const nextErrors = validateTarifForm(form, tarifs, tarif?.id ?? null, t);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const payload = buildTarifPayload(form);
    const onSuccess = () => onOpenChange(false);
    const onError = (error: unknown) => {
      toast.error(errorMessage(error, "tarifs.errors.createFailed"));
    };

    if (tarif) {
      replaceTarif.mutate(
        { id: tarif.id, input: payload },
        { onSuccess, onError }
      );
    } else {
      createTarif.mutate(payload, { onSuccess, onError });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? t("tarifs.form.editTitle")
              : t("tarifs.form.createTitle")}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? t("tarifs.form.noUpdateNotice")
              : t("tarifs.form.subtitle")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-1" noValidate>
          <FormField
            label={t("tarifs.kmMax")}
            htmlFor="tarif-km-max"
            error={errors.kmMax}
            hint={t("tarifs.form.kmMaxHint")}
            required
          >
            <Input
              id="tarif-km-max"
              inputMode="decimal"
              value={form.kmMax}
              onChange={(event) => set("kmMax", event.target.value)}
              autoComplete="off"
            />
          </FormField>

          <FormField
            label={t("tarifs.price")}
            htmlFor="tarif-price"
            error={errors.prixEuro}
            hint={t("tarifs.form.priceHint")}
            required
          >
            <Input
              id="tarif-price"
              inputMode="decimal"
              value={form.prixEuro}
              onChange={(event) => set("prixEuro", event.target.value)}
              autoComplete="off"
            />
          </FormField>

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
