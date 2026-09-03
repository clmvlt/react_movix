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
import { ApiError } from "@/lib/api-error";
import {
  useCreateZone,
  useRenameZone,
  ZONE_NAME_MAX,
  type Zone,
} from "@/features/zones";

interface ZoneFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zone: Zone | null;
  zones: Zone[];
  onSaved: (zone: Zone) => void;
  onGone: () => void;
}

export function ZoneFormDialog({
  open,
  onOpenChange,
  zone,
  zones,
  onSaved,
  onGone,
}: ZoneFormDialogProps) {
  const { t } = useTranslation();
  const createZone = useCreateZone();
  const renameZone = useRenameZone();
  const toast = useToast();

  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(zone?.name ?? "");
    setNameError(null);
  }, [open, zone]);

  const isEdit = Boolean(zone);
  const pending = createZone.isPending || renameZone.isPending;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setNameError(null);

    const trimmed = name.trim();
    if (!trimmed) {
      setNameError(t("zones.form.nameRequired"));
      return;
    }
    if (trimmed.length > ZONE_NAME_MAX) {
      setNameError(t("zones.form.nameTooLong", { max: ZONE_NAME_MAX }));
      return;
    }

    const duplicate = zones.some(
      (other) =>
        other.id !== zone?.id &&
        (other.name ?? "").trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (duplicate) {
      setNameError(t("zones.form.duplicate"));
      return;
    }

    const onError = (error: unknown) => {
      if (error instanceof ApiError) {
        if (error.status === 404) {
          onOpenChange(false);
          onGone();
          return;
        }
        const fieldError = error.fieldErrors.name;
        if (fieldError) {
          setNameError(fieldError);
          return;
        }
      }
      toast.error(t("zones.form.failed"));
    };

    const onSuccess = (saved: Zone) => {
      onOpenChange(false);
      onSaved(saved);
    };

    if (zone) {
      renameZone.mutate(
        { id: zone.id, input: { name: trimmed } },
        { onSuccess, onError }
      );
    } else {
      createZone.mutate({ name: trimmed }, { onSuccess, onError });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("zones.form.renameTitle") : t("zones.form.createTitle")}
          </DialogTitle>
          <DialogDescription>{t("zones.form.subtitle")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-1" noValidate>
          <FormField
            label={t("zones.form.name")}
            htmlFor="zone-name"
            error={nameError ?? undefined}
            required
          >
            <Input
              id="zone-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t("zones.form.namePlaceholder")}
              maxLength={ZONE_NAME_MAX}
              autoComplete="off"
            />
          </FormField>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? t("common.save") : t("common.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
