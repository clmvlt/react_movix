import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DetailField } from "@/components/detail-field";
import { FormField } from "@/components/form-field";
import {
  buildUpdatePayload,
  initialFormState,
  validatePharmacyForm,
  type PharmacyFormState,
} from "@/components/pharmacies/pharmacy-form";
import { ApiError } from "@/lib/api-error";
import { useToast } from "@/app/toast-context";
import {
  PHARMACY_TEXT_MAX,
  useUpdatePharmacy,
  type PharmacyDetail,
} from "@/features/pharmacies";

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

interface ReportPharmacyInfoSectionProps {
  pharmacy: PharmacyDetail;
  onDirtyChange: (dirty: boolean) => void;
}

export function ReportPharmacyInfoSection({
  pharmacy,
  onDirtyChange,
}: ReportPharmacyInfoSectionProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const updatePharmacy = useUpdatePharmacy();

  const [form, setForm] = useState<PharmacyFormState | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const labels: Record<FieldKey, string> = {
    name: t("common.name"),
    address1: t("common.address"),
    address2: `${t("common.address")} 2`,
    postalCode: t("common.postalCode"),
    city: t("common.city"),
    phone: t("common.phone"),
    email: t("common.email"),
  };

  const editing = form !== null;

  const payload = useMemo(
    () => (form ? buildUpdatePayload(form, pharmacy) : {}),
    [form, pharmacy]
  );
  const dirty = editing && Object.keys(payload).length > 0;

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  const startEditing = () => {
    setForm(initialFormState(pharmacy));
    setFieldErrors({});
  };

  const stopEditing = () => {
    setForm(null);
    setFieldErrors({});
  };

  const set = (
    key: FieldKey | "informations" | "commentaire",
    value: string
  ) => setForm((prev) => (prev ? { ...prev, [key]: value } : prev));

  const errorFor = (key: FieldKey) =>
    key === "postalCode"
      ? (fieldErrors.postal_code ?? fieldErrors.postalCode)
      : fieldErrors[key];

  const handleSave = () => {
    if (!form) return;

    const errors = validatePharmacyForm(form, false, t, [
      ...FIELDS,
      "informations",
      "commentaire",
    ]);
    setFieldErrors(errors);
    if (Object.values(errors).some(Boolean)) return;

    updatePharmacy.mutate(
      { cip: pharmacy.cip, input: payload },
      {
        onSuccess: () => {
          stopEditing();
          toast.success(t("pharmacies.reports.infoSaved"));
        },
        onError: (error) => {
          if (error instanceof ApiError) {
            const fields = error.fieldErrors;
            if (Object.keys(fields).length > 0) {
              setFieldErrors(fields);
              return;
            }
          }
          toast.error(t("pharmacies.form.failed"));
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
                error={errorFor(key)}
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

            <FormField
              label={t("pharmacies.info.informations")}
              htmlFor="report-edit-informations"
              error={fieldErrors.informations}
              hint={t("pharmacies.form.charCount", {
                count: form.informations.length,
                max: PHARMACY_TEXT_MAX,
              })}
              className="sm:col-span-2"
            >
              <Textarea
                id="report-edit-informations"
                value={form.informations}
                onChange={(event) => set("informations", event.target.value)}
                rows={3}
              />
            </FormField>

            <FormField
              label={t("pharmacies.info.commentaire")}
              htmlFor="report-edit-commentaire"
              error={fieldErrors.commentaire}
              hint={t("pharmacies.form.charCount", {
                count: form.commentaire.length,
                max: PHARMACY_TEXT_MAX,
              })}
              className="sm:col-span-2"
            >
              <Textarea
                id="report-edit-commentaire"
                value={form.commentaire}
                onChange={(event) => set("commentaire", event.target.value)}
                rows={3}
              />
            </FormField>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="min-h-11 lg:min-h-10"
              onClick={stopEditing}
              disabled={updatePharmacy.isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              className="min-h-11 lg:min-h-10"
              onClick={handleSave}
              disabled={updatePharmacy.isPending || !dirty}
            >
              {updatePharmacy.isPending && <Loader2 className="animate-spin" />}
              {t("common.save")}
            </Button>
          </div>
        </>
      ) : (
        <>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DetailField label={t("common.name")}>{pharmacy.name}</DetailField>
            <DetailField label={t("pharmacies.info.address")}>
              {[pharmacy.address1, pharmacy.address2].filter((line) =>
                Boolean(line?.trim())
              ).length > 0 ? (
                <span className="block">
                  {[pharmacy.address1, pharmacy.address2]
                    .filter((line) => Boolean(line?.trim()))
                    .map((line) => (
                      <span key={line} className="block">
                        {line}
                      </span>
                    ))}
                </span>
              ) : null}
            </DetailField>
            <DetailField label={t("pharmacies.columns.location")}>
              {[pharmacy.postalCode, pharmacy.city].filter(Boolean).join(" ")}
            </DetailField>
            <DetailField label={t("common.phone")}>
              {pharmacy.phone}
            </DetailField>
            <DetailField label={t("common.email")}>
              {pharmacy.email}
            </DetailField>
            <DetailField
              label={t("pharmacies.info.informations")}
              className="sm:col-span-2"
            >
              {pharmacy.informations?.trim() && (
                <span className="whitespace-pre-line break-words">
                  {pharmacy.informations}
                </span>
              )}
            </DetailField>
            <DetailField
              label={t("pharmacies.info.commentaire")}
              className="sm:col-span-2"
            >
              {pharmacy.commentaire?.trim() && (
                <span className="whitespace-pre-line break-words">
                  {pharmacy.commentaire}
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
