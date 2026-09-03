import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Info, Loader2, Mail, MailX, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/app/toast-context";
import { FormField } from "@/components/form-field";
import { ViewSwitch } from "@/components/view-switch";
import { AnomalyTypeSelect } from "@/components/anomalies/anomaly-type-select";
import {
  AnomalyPicturePicker,
  type PendingPicture,
} from "@/components/anomalies/anomaly-picture-picker";
import { PharmacyPicker } from "@/components/pharmacies/pharmacy-picker";
import { invalidEmails, parseEmails } from "@/components/anomalies/anomaly-emails";
import { useAnomalyError } from "@/components/anomalies/use-anomaly-error";
import type { CommandPackage } from "@/features/commands";
import type { Pharmacy } from "@/features/pharmacies";
import {
  ANOMALY_ACTIONS_MAX,
  ANOMALY_DESCRIPTION_MAX,
  useGenerateAnomaly,
  type AnomalyDetail,
} from "@/features/anomalies";

type EmailMode = "account" | "send" | "skip";

interface AnomalyCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commandId?: string;
  commandPharmacyName?: string | null;
  commandPharmacyCip?: string | null;
  packages?: CommandPackage[];
  onCreated?: (anomaly: AnomalyDetail) => void;
}

export function AnomalyCreateDialog({
  open,
  onOpenChange,
  commandId,
  commandPharmacyName,
  commandPharmacyCip,
  packages,
  onCreated,
}: AnomalyCreateDialogProps) {
  const { t } = useTranslation();
  const generate = useGenerateAnomaly();
  const describeError = useAnomalyError();
  const toast = useToast();

  const [code, setCode] = useState("");
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [barcodes, setBarcodes] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [actions, setActions] = useState("");
  const [pictures, setPictures] = useState<PendingPicture[]>([]);
  const [emailMode, setEmailMode] = useState<EmailMode>("account");
  const [recipients, setRecipients] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCode("");
    setPharmacy(null);
    setBarcodes([]);
    setDescription("");
    setActions("");
    setPictures([]);
    setEmailMode("account");
    setRecipients("");
    setSubmitted(false);
  }, [open]);

  const fromCommand = Boolean(commandId);
  const commandPackages = (packages ?? []).filter((item) => item.barcode);
  const needsPharmacy = !fromCommand || !commandPharmacyCip;

  const parsedRecipients = parseEmails(recipients);
  const badRecipients = invalidEmails(parsedRecipients);

  const codeError = submitted && !code ? t("common.required") : undefined;
  const pharmacyError =
    submitted && needsPharmacy && !pharmacy ? t("common.required") : undefined;
  const descriptionError =
    description.length > ANOMALY_DESCRIPTION_MAX
      ? t("anomalies.form.tooLong", { count: ANOMALY_DESCRIPTION_MAX })
      : undefined;
  const actionsError =
    actions.length > ANOMALY_ACTIONS_MAX
      ? t("anomalies.form.tooLong", { count: ANOMALY_ACTIONS_MAX })
      : undefined;
  const recipientsError =
    emailMode === "send" && badRecipients.length > 0
      ? t("anomalies.form.invalidEmails", { list: badRecipients.join(", ") })
      : undefined;

  const toggleBarcode = (barcode: string) =>
    setBarcodes((prev) =>
      prev.includes(barcode)
        ? prev.filter((entry) => entry !== barcode)
        : [...prev, barcode]
    );

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);

    if (
      !code ||
      (needsPharmacy && !pharmacy) ||
      descriptionError ||
      actionsError ||
      recipientsError
    ) {
      return;
    }

    generate.mutate(
      {
        code,
        ...(commandId ? { commandId } : {}),
        ...(pharmacy ? { cip: pharmacy.cip } : {}),
        ...(barcodes.length > 0 ? { barcodes } : {}),
        other: description,
        actions,
        pictures: pictures.map((picture) => ({ base64: picture.dataUrl })),
        sendEmail:
          emailMode === "account" ? null : emailMode === "send" ? true : false,
        ...(emailMode === "send" && parsedRecipients.length > 0
          ? { recipientEmails: parsedRecipients }
          : {}),
      },
      {
        onSuccess: (created) => {
          onOpenChange(false);
          onCreated?.(created);
        },
        onError: (cause) =>
          toast.error(describeError(cause, "anomalies.errors.createNotFound")),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("anomalies.form.title")}</DialogTitle>
          <DialogDescription>
            {fromCommand
              ? t("anomalies.form.subtitleCommand", {
                  name: commandPharmacyName ?? commandPharmacyCip ?? "",
                })
              : t("anomalies.form.subtitle")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <FormField
            label={t("anomalies.form.type")}
            htmlFor="anomaly-type"
            error={codeError}
            required
          >
            <AnomalyTypeSelect
              id="anomaly-type"
              value={code}
              onChange={setCode}
              invalid={Boolean(codeError)}
            />
          </FormField>

          {needsPharmacy ? (
            <FormField
              label={t("anomalies.form.pharmacy")}
              htmlFor="anomaly-pharmacy"
              error={pharmacyError}
              hint={t("anomalies.form.pharmacyHint")}
              required
            >
              <PharmacyPicker
                id="anomaly-pharmacy"
                value={pharmacy?.cip ?? ""}
                selected={pharmacy}
                onSelect={setPharmacy}
                invalid={Boolean(pharmacyError)}
              />
            </FormField>
          ) : (
            <FormField
              label={t("anomalies.form.pharmacy")}
              htmlFor="anomaly-pharmacy-fixed"
              hint={t("anomalies.form.pharmacyFromCommand")}
            >
              <Input
                id="anomaly-pharmacy-fixed"
                value={`${commandPharmacyName ?? ""} ${commandPharmacyCip ?? ""}`.trim()}
                readOnly
                className="min-h-11 lg:min-h-10"
              />
            </FormField>
          )}

          {fromCommand && commandPackages.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <Label>{t("anomalies.form.packages")}</Label>
              <ul className="max-h-40 overflow-y-auto rounded-md border p-1">
                {commandPackages.map((item, index) => {
                  const barcode = item.barcode as string;
                  const id = `anomaly-barcode-${index}`;
                  return (
                    <li key={barcode} className="flex items-center gap-2.5 p-2">
                      <Checkbox
                        id={id}
                        checked={barcodes.includes(barcode)}
                        onCheckedChange={() => toggleBarcode(barcode)}
                        className="size-5"
                      />
                      <Label
                        htmlFor={id}
                        className="min-w-0 flex-1 font-normal"
                      >
                        <span className="block truncate">
                          {item.designation ?? item.type ?? barcode}
                        </span>
                        <span className="block truncate text-xs tabular-nums text-muted-foreground">
                          {barcode}
                        </span>
                      </Label>
                    </li>
                  );
                })}
              </ul>
              <p className="min-h-[1rem] text-xs leading-4 text-muted-foreground">
                {t("anomalies.form.packagesHint")}
              </p>
            </div>
          )}

          <FormField
            label={t("anomalies.form.description")}
            htmlFor="anomaly-description"
            error={descriptionError}
            hint={t("anomalies.form.counter", {
              count: description.length,
              max: ANOMALY_DESCRIPTION_MAX,
            })}
          >
            <Textarea
              id="anomaly-description"
              value={description}
              maxLength={ANOMALY_DESCRIPTION_MAX}
              onChange={(event) => setDescription(event.target.value)}
            />
          </FormField>

          <FormField
            label={t("anomalies.form.actions")}
            htmlFor="anomaly-actions"
            error={actionsError}
            hint={t("anomalies.form.counter", {
              count: actions.length,
              max: ANOMALY_ACTIONS_MAX,
            })}
          >
            <Textarea
              id="anomaly-actions"
              value={actions}
              maxLength={ANOMALY_ACTIONS_MAX}
              onChange={(event) => setActions(event.target.value)}
            />
          </FormField>

          <div className="flex flex-col gap-1.5">
            <Label>{t("anomalies.form.pictures")}</Label>
            <AnomalyPicturePicker
              value={pictures}
              onChange={setPictures}
              disabled={generate.isPending}
            />
          </div>

          <div className="mt-2 flex flex-col gap-1.5 border-t pt-3">
            <Label>{t("anomalies.form.email")}</Label>
            <ViewSwitch
              value={emailMode}
              onChange={setEmailMode}
              items={[
                {
                  value: "account",
                  label: t("anomalies.form.emailAccount"),
                  icon: Settings2,
                },
                {
                  value: "send",
                  label: t("anomalies.form.emailSend"),
                  icon: Mail,
                },
                {
                  value: "skip",
                  label: t("anomalies.form.emailSkip"),
                  icon: MailX,
                },
              ]}
            />
            {emailMode === "send" && (
              <FormField
                label={t("anomalies.form.recipients")}
                htmlFor="anomaly-recipients"
                error={recipientsError}
                hint={t("anomalies.form.recipientsHint")}
              >
                <Input
                  id="anomaly-recipients"
                  value={recipients}
                  onChange={(event) => setRecipients(event.target.value)}
                  autoComplete="off"
                  className="min-h-11 lg:min-h-10"
                />
              </FormField>
            )}
          </div>

          <Alert>
            <Info />
            <AlertDescription>
              {t("anomalies.form.asyncEmailNotice")}
            </AlertDescription>
          </Alert>

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
              disabled={generate.isPending}
            >
              {generate.isPending && <Loader2 className="size-4 animate-spin" />}
              {t("anomalies.form.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
