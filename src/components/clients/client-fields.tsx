import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/form-field";
import { cn } from "@/lib/utils";
import { CLIENT_TEXT_MAX } from "@/features/clients";
import { clientFieldId, type ClientFormState } from "./client-form";
import type { ClientFormApi } from "./use-client-form";

export { SectionCard } from "@/components/section-card";

const COUNTER_THRESHOLD = 0.9;

type TextKey = {
  [K in keyof ClientFormState]: ClientFormState[K] extends string ? K : never;
}[keyof ClientFormState];

interface ClientTextFieldProps
  extends Omit<ComponentProps<typeof Input>, "id" | "value" | "onChange"> {
  api: ClientFormApi;
  field: TextKey;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  fieldClassName?: string;
}

export function ClientTextField({
  api,
  field,
  label,
  hint,
  error: errorOverride,
  required,
  fieldClassName,
  className,
  ...inputProps
}: ClientTextFieldProps) {
  const id = clientFieldId(api.idPrefix, field);
  const error = errorOverride ?? api.errors[field];
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

interface ClientBillingFieldProps
  extends Omit<ComponentProps<typeof Input>, "id" | "value" | "onChange"> {
  api: ClientFormApi;
  field: keyof ClientFormState["billingAddress"];
  label: string;
  hint?: string;
  fieldClassName?: string;
}

export function ClientBillingField({
  api,
  field,
  label,
  hint,
  fieldClassName,
  className,
  ...inputProps
}: ClientBillingFieldProps) {
  const key = `billingAddress.${field}`;
  const id = clientFieldId(api.idPrefix, key);
  const error = api.errors[key];
  return (
    <FormField
      label={label}
      htmlFor={id}
      error={error}
      hint={hint}
      className={fieldClassName}
    >
      <Input
        id={id}
        value={api.form.billingAddress[field]}
        onChange={(event) => api.setBilling(field, event.target.value)}
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

interface ClientTextAreaProps {
  api: ClientFormApi;
  field: "informations" | "commentaire";
  label: string;
  hint: string;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  fieldClassName?: string;
}

export function ClientTextArea({
  api,
  field,
  label,
  hint,
  placeholder,
  rows = 4,
  disabled,
  fieldClassName,
}: ClientTextAreaProps) {
  const { t } = useTranslation();
  const id = clientFieldId(api.idPrefix, field);
  const value = api.form[field];
  const error = api.errors[field];
  const nearLimit = value.length >= CLIENT_TEXT_MAX * COUNTER_THRESHOLD;
  return (
    <FormField
      label={label}
      htmlFor={id}
      error={error}
      hint={
        nearLimit
          ? t("clients.form.charCount", {
              count: value.length,
              max: CLIENT_TEXT_MAX,
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
