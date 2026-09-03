import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
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
import { useCommandError } from "@/components/commands/use-command-error";
import { useToast } from "@/app/toast-context";
import { useUpdateCommandTarif } from "@/features/commands";

interface CommandTarifDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commandIds: string[];
  onDone: () => void;
  initialTarif?: number | null;
}

export function CommandTarifDialog({
  open,
  onOpenChange,
  commandIds,
  onDone,
  initialTarif,
}: CommandTarifDialogProps) {
  const { t } = useTranslation();
  const updateTarif = useUpdateCommandTarif();
  const describeError = useCommandError();
  const toast = useToast();

  const [tarif, setTarif] = useState("");

  useEffect(() => {
    if (!open) return;
    setTarif(initialTarif == null ? "" : String(initialTarif));
  }, [open, initialTarif]);

  const trimmed = tarif.trim().replace(",", ".");
  const parsed = trimmed === "" ? null : Number(trimmed);
  const invalid = parsed !== null && !Number.isFinite(parsed);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (invalid) return;
    updateTarif.mutate(
      { commandIds, tarif: parsed },
      {
        onSuccess: () => {
          onOpenChange(false);
          onDone();
        },
        onError: (cause) => toast.error(describeError(cause)),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("commands.tarifDialog.title")}</DialogTitle>
          <DialogDescription>
            {t("commands.tarifDialog.subtitle", { count: commandIds.length })}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <FormField
            label={t("commands.tarif")}
            htmlFor="command-tarif"
            error={invalid ? t("commands.tarifDialog.invalid") : undefined}
            hint={t("commands.tarifDialog.clearHint")}
          >
            <Input
              id="command-tarif"
              inputMode="decimal"
              value={tarif}
              onChange={(event) => setTarif(event.target.value)}
              placeholder="0.00"
              className="min-h-11 lg:min-h-10"
            />
          </FormField>

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
              disabled={updateTarif.isPending || invalid}
            >
              {updateTarif.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              {t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
