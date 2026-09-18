import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateField } from "@/components/date-field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ColorPicker } from "@/components/color-picker";
import { FormField } from "@/components/form-field";
import { ClientSelectField } from "@/components/clients/client-select-field";
import type { Client } from "@/features/clients";
import { useWorkingDate } from "@/app/working-date-context";
import { useCreateTour } from "@/features/tours";

export function CreateTourDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const { date } = useWorkingDate();
  const create = useCreateTour();
  const [name, setName] = useState("");
  const [initialDate, setInitialDate] = useState(date);
  const [color, setColor] = useState("#2563eb");
  const [client, setClient] = useState<Client | null>(null);

  useEffect(() => {
    if (open) {
      setName("");
      setInitialDate(date);
      setColor("#2563eb");
      setClient(null);
    }
  }, [open, date]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    create.mutate(
      {
        name: name.trim(),
        initialDate,
        color,
        ...(client ? { clientId: client.id } : {}),
      },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("tours.createDialog.title")}</DialogTitle>
          <DialogDescription>
            {t("tours.createDialog.subtitle")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-1">
          <FormField label={t("common.name")} htmlFor="tour-name" required>
            <Input
              id="tour-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </FormField>
          <FormField
            label={t("tours.createDialog.date")}
            htmlFor="tour-date"
            required
          >
            <DateField
              id="tour-date"
              value={initialDate}
              onChange={setInitialDate}
              required
            />
          </FormField>
          <FormField
            label={t("tours.createDialog.color")}
            htmlFor="tour-color"
          >
            <ColorPicker
              id="tour-color"
              value={color}
              onChange={setColor}
              label={t("tours.createDialog.color")}
            />
          </FormField>
          <FormField
            label={t("tours.orderer")}
            htmlFor="tour-orderer-create"
            hint={t("tours.ordererHint")}
          >
            <ClientSelectField
              id="tour-orderer-create"
              value={client}
              onChange={setClient}
              disabled={create.isPending}
              dialogTitle={t("commands.parties.pick.orderer")}
            />
          </FormField>

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending && <Loader2 className="size-4 animate-spin" />}
              {t("common.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
