import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DetailField } from "@/components/detail-field";
import { FormField } from "@/components/form-field";
import {
  buildClientInput,
  initialClientForm,
  validateClientForm,
  type ClientFormState,
} from "@/components/clients/client-form";
import { ApiError } from "@/lib/api-error";
import { useToast } from "@/app/toast-context";
import { CLIENT_TEXT_MAX, useUpdateClient, type Client } from "@/features/clients";

const FIELDS = [
  "name",
  "address1",
  "address2",
  "postalCode",
  "city",
  "phone",
  "email",
] as const;

type FieldKey = (typeof FIELDS)[number];

interface ReportClientInfoSectionProps {
  client: Client;
  onDirtyChange: (dirty: boolean) => void;
}

export function ReportClientInfoSection({
  client,
  onDirtyChange,
}: ReportClientInfoSectionProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const updateClient = useUpdateClient();

  const [form, setForm] = useState<ClientFormState | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const labels: Record<FieldKey, string> = {
    name: t("clients.fields.name"),
    address1: t("clients.fields.address1"),
    address2: t("clients.fields.address2"),
    postalCode: t("clients.fields.postalCode"),
    city: t("clients.fields.city"),
    phone: t("clients.fields.phone"),
    email: t("clients.fields.email"),
  };

  const editing = form !== null;

  const dirty = useMemo(() => {
    if (!form) return false;
    return (
      JSON.stringify(buildClientInput(form)) !==
      JSON.stringify(buildClientInput(initialClientForm(client)))
    );
  }, [form, client]);

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  const startEditing = () => {
    setForm(initialClientForm(client));
    setFieldErrors({});
  };

  const stopEditing = () => {
    setForm(null);
    setFieldErrors({});
  };

  const set = (key: FieldKey | "informations" | "commentaire", value: string) =>
    setForm((previous) => (previous ? { ...previous, [key]: value } : previous));

  const handleSave = () => {
    if (!form) return;

    const errors = validateClientForm(form, t);
    setFieldErrors(errors);
    if (Object.values(errors).some(Boolean)) return;

    updateClient.mutate(
      { id: client.id, input: buildClientInput(form) },
      {
        onSuccess: () => {
          stopEditing();
          toast.success(t("clientReports.infoSaved"));
        },
        onError: (error) => {
          if (error instanceof ApiError) {
            const fields = error.structuredFieldErrors;
            if (Object.keys(fields).length > 0) {
              setFieldErrors(fields);
              return;
            }
          }
          toast.error(t("clients.errors.saveFailed"));
        },
      }
    );
  };

  return (
    <div className="flex flex-col gap-3">
      {editing && form ? (
        <>
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            {FIELDS.map((key) => (
              <FormField
                key={key}
                label={labels[key]}
                htmlFor={`report-edit-${key}`}
                error={fieldErrors[key]}
              >
                <Input
                  id={`report-edit-${key}`}
                  type={key === "email" ? "email" : undefined}
                  inputMode={key === "phone" ? "tel" : undefined}
                  value={form[key]}
                  onChange={(event) => set(key, event.target.value)}
                  className="min-h-11 lg:min-h-10"
                  autoComplete="off"
                />
              </FormField>
            ))}

            {(["informations", "commentaire"] as const).map((key) => (
              <FormField
                key={key}
                label={t(`clients.fields.${key}`)}
                htmlFor={`report-edit-${key}`}
                error={fieldErrors[key]}
                hint={t("clients.form.charCount", {
                  count: form[key].length,
                  max: CLIENT_TEXT_MAX,
                })}
                className="sm:col-span-2"
              >
                <Textarea
                  id={`report-edit-${key}`}
                  value={form[key]}
                  onChange={(event) => set(key, event.target.value)}
                  rows={3}
                />
              </FormField>
            ))}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="min-h-11 lg:min-h-10"
              onClick={stopEditing}
              disabled={updateClient.isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              className="min-h-11 lg:min-h-10"
              onClick={handleSave}
              disabled={updateClient.isPending || !dirty}
            >
              {updateClient.isPending && <Loader2 className="animate-spin" />}
              {t("common.save")}
            </Button>
          </div>
        </>
      ) : (
        <>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DetailField label={t("clients.fields.name")}>
              {client.name}
            </DetailField>
            <DetailField label={t("clients.sections.address")}>
              {[client.address1, client.address2].some((line) =>
                Boolean(line?.trim())
              ) ? (
                <span className="block">
                  {[client.address1, client.address2]
                    .filter((line) => Boolean(line?.trim()))
                    .map((line) => (
                      <span key={line} className="block">
                        {line}
                      </span>
                    ))}
                </span>
              ) : null}
            </DetailField>
            <DetailField label={t("clients.columns.place")}>
              {[client.postalCode, client.city].filter(Boolean).join(" ")}
            </DetailField>
            <DetailField label={t("clients.fields.phone")}>
              {client.phone}
            </DetailField>
            <DetailField label={t("clients.fields.email")}>
              {client.email}
            </DetailField>
            <DetailField
              label={t("clients.fields.informations")}
              className="sm:col-span-2"
            >
              {client.informations?.trim() && (
                <span className="whitespace-pre-line break-words">
                  {client.informations}
                </span>
              )}
            </DetailField>
            <DetailField
              label={t("clients.fields.commentaire")}
              className="sm:col-span-2"
            >
              {client.commentaire?.trim() && (
                <span className="whitespace-pre-line break-words">
                  {client.commentaire}
                </span>
              )}
            </DetailField>
          </dl>
          <Button
            type="button"
            variant="outline"
            className="min-h-11 w-fit lg:min-h-10"
            onClick={startEditing}
          >
            <Pencil className="size-4" />
            {t("common.edit")}
          </Button>
        </>
      )}
    </div>
  );
}
