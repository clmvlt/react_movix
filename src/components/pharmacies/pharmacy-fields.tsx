import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/form-field";
import { cn } from "@/lib/utils";
import { PHARMACY_TEXT_MAX } from "@/features/pharmacies";
import {
  pharmacyFieldId,
  type PharmacyFormState,
} from "@/components/pharmacies/pharmacy-form";
import type { PharmacyFormApi } from "@/components/pharmacies/use-pharmacy-form";

export { SectionCard } from "@/components/section-card";

const COUNTER_THRESHOLD = 0.9;

type TextKey = {
  [K in keyof PharmacyFormState]: PharmacyFormState[K] extends string ? K : never;
}[keyof PharmacyFormState];

interface PharmacyTextFieldProps
  extends Omit<ComponentProps<typeof Input>, "id" | "value" | "onChange"> {
  api: PharmacyFormApi;
  field: TextKey;
  label: string;
  hint?: string;
  required?: boolean;
  fieldClassName?: string;
}

export function PharmacyTextField({
  api,
  field,
  label,
  hint,
  required,
  fieldClassName,
  className,
  ...inputProps
}: PharmacyTextFieldProps) {
  const id = pharmacyFieldId(api.idPrefix, field);
  const error = api.errors[field];
  return (
    <FormField
      label={label}
      htmlFor={id}
      error={error}
      hint={hint}
      required={required}
      className={fieldClassName}
    >
      <Input
        id={id}
        value={api.form[field]}
        onChange={(event) => api.set(field, event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={`${id}-message`}
        autoComplete="off"
        enterKeyHint="next"
        className={cn(
          "min-h-11 lg:min-h-10",
          error && "border-destructive",
          className
        )}
        {...inputProps}
      />
    </FormField>
  );
}

interface PharmacyTextAreaProps {
  api: PharmacyFormApi;
  field: "informations" | "commentaire";
  label: string;
  hint: string;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  fieldClassName?: string;
}

export function PharmacyTextArea({
  api,
  field,
  label,
  hint,
  placeholder,
  rows = 4,
  disabled,
  fieldClassName,
}: PharmacyTextAreaProps) {
  const { t } = useTranslation();
  const id = pharmacyFieldId(api.idPrefix, field);
  const value = api.form[field];
  const error = api.errors[field];
  const nearLimit = value.length >= PHARMACY_TEXT_MAX * COUNTER_THRESHOLD;
  return (
    <FormField
      label={label}
      htmlFor={id}
      error={error}
      hint={
        nearLimit
          ? t("pharmacies.form.charCount", {
              count: value.length,
              max: PHARMACY_TEXT_MAX,
            })
          : hint
      }
      className={fieldClassName}
    >
      <Textarea
        id={id}
        value={value}
        onChange={(event) => api.set(field, event.target.value)}
        rows={rows}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={`${id}-message`}
        className={cn(error && "border-destructive")}
      />
    </FormField>
  );
}
