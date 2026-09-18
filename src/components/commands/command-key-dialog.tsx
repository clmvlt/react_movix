import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormField } from "@/components/form-field";
import { KeyColorInput } from "@/components/key-color-input";
import { KeyTag } from "@/components/key-tag";
import { useToast } from "@/app/toast-context";
import { ApiError, apiErrorText } from "@/lib/api-error";
import {
  buildClientInput,
  initialClientForm,
} from "@/components/clients/client-form";
import {
  clientLabel,
  useUpdateClient,
  type PharmacyClient,
} from "@/features/clients";

export type CommandKeyClient = PharmacyClient;

interface CommandKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pharmacy: CommandKeyClient;
  onDone?: () => void;
}

type KeyErrors = Partial<Record<"numero" | "color", string>>;

export function CommandKeyDialog({
  open,
  onOpenChange,
  pharmacy,
  onDone,
}: CommandKeyDialogProps) {
  const { t } = useTranslation();
    const update = useUpdateClient();
  const toast = useToast();

  const baseNumero = (pharmacy.numero ?? "").trim();
  const baseColor = (pharmacy.color ?? "").trim();
  const [numero, setNumero] = useState(baseNumero);
  const [color, setColor] = useState(baseColor);
  const [errors, setErrors] = useState<KeyErrors>({});

  useEffect(() => {
    if (!open) return;
    setNumero((pharmacy.numero ?? "").trim());
    setColor((pharmacy.color ?? "").trim());
    setErrors({});
  }, [open, pharmacy.numero, pharmacy.color]);

  const nextNumero = numero.trim();
  const nextColor = color.trim();
  const unchanged = nextNumero === baseNumero && nextColor === baseColor;
  const hasKey = Boolean(nextNumero || nextColor);

  const client = pharmacy;
  const pending = update.isPending;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (unchanged || pending || !client) return;
    const form = {
      ...initialClientForm(client),
      numero: nextNumero,
      color: nextColor,
    };
    update.mutate(
      { id: client.id, input: buildClientInput(form) },
      {
        onSuccess: () => {
          toast.success(t("commands.keyDialog.saved"));
          onOpenChange(false);
          onDone?.();
        },
        onError: (cause: unknown) => {
          if (cause instanceof ApiError) {
            const fields = cause.structuredFieldErrors;
            const known: KeyErrors = {};
            if (fields.numero) known.numero = fields.numero;
            if (fields.color) known.color = fields.color;
            if (Object.keys(known).length > 0) {
              setErrors(known);
              toast.error(t("clients.form.invalid"));
              return;
            }
          }
          toast.error(apiErrorText(cause) ?? t("clients.errors.saveFailed"));
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("commands.keyDialog.title")}</DialogTitle>
          <DialogDescription>
            {t("commands.keyDialog.subtitle", { name: clientLabel(pharmacy) })}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <div className="flex min-h-10 items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm">
            <KeyRound
              aria-hidden
              className="size-4 shrink-0 text-muted-foreground"
            />
            {hasKey ? (
              <KeyTag color={nextColor} numero={nextNumero} size="md" />
            ) : (
              <span className="text-muted-foreground">
                {t("clientReports.info.keyNone")}
              </span>
            )}
          </div>

          <FormField
            label={t("clientReports.info.numero")}
            htmlFor="command-key-numero"
            error={errors.numero}
          >
            <Input
              id="command-key-numero"
              value={numero}
              onChange={(event) => setNumero(event.target.value)}
              className="min-h-11 tabular-nums lg:min-h-10"
              autoComplete="off"
            />
          </FormField>

          <FormField
            label={t("clientReports.info.color")}
            htmlFor="command-key-color"
            error={errors.color}
          >
            <KeyColorInput
              id="command-key-color"
              value={color}
              onChange={setColor}
            />
          </FormField>

          <p className="text-xs text-muted-foreground">
            {t("clientReports.info.accountScope")}
          </p>

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              className="min-h-11 lg:min-h-10"
              onClick={() => onOpenChange(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              className="min-h-11 lg:min-h-10"
              disabled={pending || unchanged}
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
