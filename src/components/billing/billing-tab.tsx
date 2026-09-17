import { useEffect, useState, type ComponentProps, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import {
  Banknote,
  Building2,
  CircleCheck,
  CircleAlert,
  FileText,
  Info,
  Landmark,
  MapPin,
  Percent,
  Wand2,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/form-field";
import { SectionCard } from "@/components/section-card";
import { LoadingState } from "@/components/states";
import { AccountSaveBar } from "@/components/account/account-save-bar";
import { useApiErrorMessage } from "@/components/account/use-account-error";
import { useToast } from "@/app/toast-context";
import {
  accountKeys,
  BILLING_INVOICE_FOOTER_MAX,
  BILLING_INVOICE_PREFIX_MAX,
  BILLING_LEGAL_NAME_MAX,
  BILLING_RCS_CITY_MAX,
  LEGAL_FORMS,
  TEXT_FIELD_MAX,
  VAT_RATES,
  VAT_REGIMES,
  useAccountBilling,
  useAccountDetails,
  useUpdateAccountBilling,
  type AccountBilling,
  type LegalForm,
} from "@/features/account";
import { ApiError } from "@/lib/api-error";
import { formatDateTime } from "@/lib/date";
import { BillingChoice } from "./billing-choice";
import {
  billingFormFrom,
  digitsOnly,
  formatSiren,
  isBillingDirty,
  isFranchise,
  needsRcsCity,
  needsShareCapital,
  sirenFromSiret,
  toBillingInput,
  validateBillingForm,
  vatNumberFromSiren,
  type BillingFormErrors,
  type BillingFormState,
} from "./billing-form";

type TextKey = {
  [K in keyof BillingFormState]: BillingFormState[K] extends string ? K : never;
}[keyof BillingFormState];

interface TextFieldOptions {
  required?: boolean;
  hint?: string;
  className?: string;
  input?: Omit<ComponentProps<typeof Input>, "id" | "value" | "onChange">;
  children?: ReactNode;
}

export function BillingTab() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();
  const errorMessage = useApiErrorMessage("billing");

  const billingQuery = useAccountBilling();
  const detailsQuery = useAccountDetails();
  const updateBilling = useUpdateAccountBilling();
  const baseline = billingQuery.data ?? null;

  const [form, setForm] = useState<BillingFormState | null>(
    () =>
      queryClient.getQueryData<BillingFormState>(accountKeys.billingDraft()) ??
      null
  );
  const [errors, setErrors] = useState<BillingFormErrors>({});

  useEffect(() => {
    if (!baseline) return;
    setForm((previous) => previous ?? billingFormFrom(baseline));
  }, [baseline]);

  useEffect(() => {
    if (!form || !baseline) return;
    if (isBillingDirty(form, baseline)) {
      queryClient.setQueryData(accountKeys.billingDraft(), form);
    } else {
      queryClient.removeQueries({
        queryKey: accountKeys.billingDraft(),
        exact: true,
      });
    }
  }, [form, baseline, queryClient]);

  if (billingQuery.isLoading) return <LoadingState />;

  if (billingQuery.isError) {
    return (
      <Alert variant="warning">
        <AlertDescription>
          {errorMessage(billingQuery.error, "billing.errors.loadFailed")}
        </AlertDescription>
      </Alert>
    );
  }

  if (!form || !baseline) return <LoadingState />;

  const pending = updateBilling.isPending;
  const disabled = pending;
  const dirty = isBillingDirty(form, baseline);
  const franchise = isFranchise(form);
  const standard = form.vatRegime === "STANDARD";

  const set = <K extends keyof BillingFormState>(
    key: K,
    value: BillingFormState[K]
  ) => {
    setForm((previous) => (previous ? { ...previous, [key]: value } : previous));
    setErrors((previous) => ({ ...previous, [key]: undefined }));
  };

  const apply = (patch: Partial<BillingFormState>) => {
    setForm((previous) => (previous ? { ...previous, ...patch } : previous));
    setErrors((previous) => {
      const next = { ...previous };
      for (const key of Object.keys(patch) as (keyof BillingFormState)[]) {
        delete next[key];
      }
      return next;
    });
  };

  const focusFirstError = (nextErrors: BillingFormErrors) => {
    const first = (Object.keys(form) as (keyof BillingFormState)[]).find(
      (key) => nextErrors[key]
    );
    if (!first) return;
    requestAnimationFrame(() => {
      const element = document.getElementById(`billing-${first}`);
      element?.scrollIntoView({ block: "center", behavior: "smooth" });
      element?.focus({ preventScroll: true });
    });
  };

  const handleSave = () => {
    const clientErrors = validateBillingForm(form, t);
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length > 0) {
      focusFirstError(clientErrors);
      return;
    }
    updateBilling.mutate(toBillingInput(form), {
      onSuccess: (fresh) => {
        setForm(billingFormFrom(fresh));
        setErrors({});
        toast.success(t("billing.saved"));
      },
      onError: (error) => {
        if (error instanceof ApiError && error.isBillingInvalid) {
          const serverErrors = error.structuredFieldErrors as BillingFormErrors;
          setErrors(serverErrors);
          focusFirstError(serverErrors);
          toast.error(errorMessage(error, "billing.errors.invalid"));
          return;
        }
        toast.error(errorMessage(error, "billing.errors.saveFailed"));
      },
    });
  };

  const handleReset = () => {
    setForm(billingFormFrom(baseline));
    setErrors({});
  };

  const textField = (
    key: TextKey,
    label: string,
    { required, hint, className, input, children }: TextFieldOptions = {}
  ) => {
    const id = `billing-${key}`;
    return (
      <FormField
        label={label}
        htmlFor={id}
        error={errors[key]}
        hint={hint}
        required={required}
        className={className}
      >
        <Input
          id={id}
          value={form[key]}
          onChange={(event) => set(key, event.target.value)}
          disabled={disabled}
          aria-invalid={errors[key] ? true : undefined}
          aria-describedby={`${id}-message`}
          {...input}
        />
        {children}
      </FormField>
    );
  };

  const numberFormat = new Intl.NumberFormat(i18n.language);

  const liveSiren = sirenFromSiret(form.siret);
  const siren = liveSiren ?? (dirty ? null : baseline.siren);
  const suggestedVat = liveSiren ? vatNumberFromSiren(liveSiren) : null;
  const vatDiffers =
    suggestedVat !== null &&
    digitsOnly(form.vatNumber).toUpperCase() !== suggestedVat;

  const company = detailsQuery.data;
  const companyHasAddress = Boolean(
    company?.address1?.trim() || company?.city?.trim()
  );

  const copyCompanyAddress = () => {
    if (!company) return;
    apply({
      address1: company.address1 ?? "",
      address2: company.address2 ?? "",
      postalCode: company.postalCode ?? "",
      city: company.city ?? "",
    });
  };

  const footerLength = form.invoiceFooter.length;

  return (
    <div className="flex flex-col gap-4">
      <BillingStatus billing={baseline} dirty={dirty} />

      <div className="grid auto-rows-min grid-cols-1 gap-4 xl:grid-cols-2">
        <SectionCard
          title={t("billing.identity.title")}
          description={t("billing.identity.subtitle")}
          icon={Building2}
        >
          <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
            {textField("legalName", t("billing.fields.legalName"), {
              required: true,
              className: "sm:col-span-2",
              input: {
                maxLength: BILLING_LEGAL_NAME_MAX,
                autoComplete: "organization",
              },
            })}
            <FormField
              label={t("billing.fields.legalForm")}
              htmlFor="billing-legalForm"
              error={errors.legalForm}
              required
            >
              <BillingChoice
                id="billing-legalForm"
                value={form.legalForm}
                options={LEGAL_FORMS.map((value) => ({
                  value,
                  label: t(`billing.legalForms.${value}`),
                }))}
                onChange={(value) => set("legalForm", value as LegalForm | "")}
                disabled={disabled}
                invalid={Boolean(errors.legalForm)}
              />
            </FormField>
            {textField("shareCapital", t("billing.fields.shareCapital"), {
              required: needsShareCapital(form),
              hint:
                form.legalForm && !needsShareCapital(form)
                  ? t("billing.identity.optionalForForm")
                  : undefined,
              input: { inputMode: "decimal", autoComplete: "off" },
            })}
            {textField("siret", t("billing.fields.siret"), {
              required: true,
              hint: siren
                ? t("billing.identity.siren", { siren: formatSiren(siren) })
                : t("billing.identity.siretHint"),
              input: { inputMode: "numeric", autoComplete: "off" },
            })}
            {textField("apeCode", t("billing.fields.apeCode"), {
              hint: t("billing.identity.apeHint"),
              input: { autoComplete: "off" },
            })}
            {textField("rcsCity", t("billing.fields.rcsCity"), {
              required: needsRcsCity(form),
              hint:
                form.legalForm && !needsRcsCity(form)
                  ? t("billing.identity.optionalForForm")
                  : t("billing.identity.rcsHint"),
              className: "sm:col-span-2",
              input: { maxLength: BILLING_RCS_CITY_MAX, autoComplete: "off" },
            })}
          </div>
        </SectionCard>

        <SectionCard
          title={t("billing.vat.title")}
          description={t("billing.vat.subtitle")}
          icon={Percent}
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label id="billing-vatRegime-label">
                {t("billing.fields.vatRegime")}
                <span className="ml-0.5 text-destructive">*</span>
              </Label>
              <div
                id="billing-vatRegime"
                role="radiogroup"
                aria-labelledby="billing-vatRegime-label"
                aria-describedby="billing-vatRegime-message"
                tabIndex={-1}
                className="flex gap-2"
              >
                {VAT_REGIMES.map((regime) => {
                  const active = form.vatRegime === regime;
                  return (
                    <Button
                      key={regime}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      variant={active ? "default" : "outline"}
                      className="min-h-11 min-w-0 flex-1 lg:min-h-10"
                      disabled={disabled}
                      onClick={() => set("vatRegime", regime)}
                    >
                      <span className="truncate">
                        {t(`billing.vatRegimes.${regime}`)}
                      </span>
                    </Button>
                  );
                })}
              </div>
              <p
                id="billing-vatRegime-message"
                role={errors.vatRegime ? "alert" : undefined}
                className={
                  errors.vatRegime
                    ? "min-h-4 text-xs leading-4 text-destructive"
                    : "min-h-4 text-xs leading-4 text-muted-foreground"
                }
              >
                {errors.vatRegime ||
                  (form.vatRegime
                    ? t(`billing.vat.regimeHint.${form.vatRegime}`)
                    : "")}
              </p>
            </div>

            {franchise && (
              <div className="rounded-lg border border-border bg-muted/50 p-3">
                <p className="text-xs font-medium text-muted-foreground">
                  {t("billing.vat.mentionPreview")}
                </p>
                <p className="mt-1 text-sm text-foreground">
                  {t("billing.vat.franchiseMention")}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
              {textField("vatNumber", t("billing.fields.vatNumber"), {
                required: standard,
                hint: vatDiffers
                  ? t("billing.vat.suggestion", { vat: suggestedVat })
                  : t("billing.vat.numberHint"),
                className: franchise ? "sm:col-span-2" : undefined,
                input: { autoComplete: "off" },
                children: vatDiffers ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11 w-full lg:min-h-9"
                    disabled={disabled}
                    onClick={() => set("vatNumber", suggestedVat ?? "")}
                  >
                    <Wand2 className="size-4" />
                    {t("billing.vat.fromSiret")}
                  </Button>
                ) : null,
              })}

              {!franchise && (
                <FormField
                  label={t("billing.fields.defaultVatRate")}
                  htmlFor="billing-defaultVatRate"
                  error={errors.defaultVatRate}
                  required={standard}
                >
                  <BillingChoice
                    id="billing-defaultVatRate"
                    value={form.defaultVatRate}
                    options={VAT_RATES.map((rate) => ({
                      value: String(rate),
                      label: t("billing.vat.rateValue", {
                        rate: numberFormat.format(rate),
                      }),
                    }))}
                    onChange={(value) => set("defaultVatRate", value)}
                    disabled={disabled}
                    invalid={Boolean(errors.defaultVatRate)}
                  />
                </FormField>
              )}
            </div>

            {!franchise && (
              <div className="flex flex-col gap-1">
                <div className="flex min-h-11 items-center gap-3">
                  <Checkbox
                    id="billing-vatOnDebits"
                    className="size-5"
                    checked={form.vatOnDebits}
                    onCheckedChange={(value) =>
                      set("vatOnDebits", value === true)
                    }
                    disabled={disabled}
                  />
                  <Label htmlFor="billing-vatOnDebits" className="cursor-pointer">
                    {t("billing.fields.vatOnDebits")}
                  </Label>
                </div>
                <p
                  className={
                    errors.vatOnDebits
                      ? "text-xs leading-4 text-destructive"
                      : "text-xs leading-4 text-muted-foreground"
                  }
                >
                  {errors.vatOnDebits || t("billing.vat.debitsHint")}
                </p>
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title={t("billing.address.title")}
          description={t("billing.address.subtitle")}
          icon={MapPin}
          contentClassName="flex flex-col gap-2"
        >
          <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
            {textField("address1", t("billing.fields.address1"), {
              required: true,
              className: "sm:col-span-2",
              input: {
                maxLength: TEXT_FIELD_MAX,
                autoComplete: "address-line1",
              },
            })}
            {textField("address2", t("billing.fields.address2"), {
              className: "sm:col-span-2",
              input: {
                maxLength: TEXT_FIELD_MAX,
                autoComplete: "address-line2",
              },
            })}
            {textField("postalCode", t("billing.fields.postalCode"), {
              required: true,
              input: {
                inputMode: "numeric",
                maxLength: 5,
                autoComplete: "postal-code",
              },
            })}
            {textField("city", t("billing.fields.city"), {
              required: true,
              input: {
                maxLength: TEXT_FIELD_MAX,
                autoComplete: "address-level2",
              },
            })}
            {textField("email", t("billing.fields.email"), {
              required: true,
              input: { type: "email", autoComplete: "email" },
            })}
            {textField("phone", t("billing.fields.phone"), {
              hint: t("billing.address.phoneHint"),
              input: { type: "tel", autoComplete: "tel" },
            })}
          </div>
          <Button
            type="button"
            variant="outline"
            className="min-h-11 w-full sm:w-auto lg:min-h-10"
            disabled={disabled || !companyHasAddress}
            onClick={copyCompanyAddress}
          >
            <Building2 className="size-4" />
            {t("billing.address.fromCompany")}
          </Button>
        </SectionCard>

        <SectionCard
          title={t("billing.bank.title")}
          description={t("billing.bank.subtitle")}
          icon={Landmark}
        >
          <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-3">
            {textField("iban", t("billing.fields.iban"), {
              className: "sm:col-span-2",
              input: { autoComplete: "off", spellCheck: false },
            })}
            {textField("bic", t("billing.fields.bic"), {
              hint: t("billing.bank.bicHint"),
              input: { autoComplete: "off", spellCheck: false, maxLength: 11 },
            })}
          </div>
        </SectionCard>

        <SectionCard
          title={t("billing.payment.title")}
          description={t("billing.payment.subtitle")}
          icon={Banknote}
          contentClassName="flex flex-col gap-2"
        >
          <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
            {textField("paymentTermDays", t("billing.fields.paymentTermDays"), {
              required: true,
              hint: t("billing.payment.termHint"),
              input: { inputMode: "numeric", autoComplete: "off" },
            })}
            {textField("latePenaltyRate", t("billing.fields.latePenaltyRate"), {
              required: true,
              input: { inputMode: "decimal", autoComplete: "off" },
            })}
            {textField(
              "earlyPaymentDiscount",
              t("billing.fields.earlyPaymentDiscount"),
              {
                className: "sm:col-span-2",
                hint: t("billing.payment.discountHint"),
                input: {
                  placeholder: t("billing.payment.noDiscount"),
                  maxLength: TEXT_FIELD_MAX,
                },
              }
            )}
          </div>
          <Alert>
            <Info />
            <AlertDescription className="flex flex-col gap-1">
              <span>{t("billing.payment.penaltyLegal")}</span>
              <span>{t("billing.payment.recoveryFee")}</span>
            </AlertDescription>
          </Alert>
        </SectionCard>

        <SectionCard
          title={t("billing.numbering.title")}
          description={t("billing.numbering.subtitle")}
          icon={FileText}
        >
          <div className="grid grid-cols-1 gap-x-4 gap-y-2">
            {textField("invoicePrefix", t("billing.fields.invoicePrefix"), {
              hint: t("billing.numbering.prefixHint", {
                max: BILLING_INVOICE_PREFIX_MAX,
              }),
              input: {
                maxLength: BILLING_INVOICE_PREFIX_MAX,
                autoComplete: "off",
              },
            })}
            <FormField
              label={t("billing.fields.invoiceFooter")}
              htmlFor="billing-invoiceFooter"
              error={errors.invoiceFooter}
              hint={t("billing.numbering.footerCount", {
                count: footerLength,
                max: BILLING_INVOICE_FOOTER_MAX,
              })}
            >
              <Textarea
                id="billing-invoiceFooter"
                rows={4}
                value={form.invoiceFooter}
                onChange={(event) => set("invoiceFooter", event.target.value)}
                maxLength={BILLING_INVOICE_FOOTER_MAX}
                disabled={disabled}
                aria-invalid={errors.invoiceFooter ? true : undefined}
                aria-describedby="billing-invoiceFooter-message"
              />
            </FormField>
          </div>
        </SectionCard>
      </div>

      <AccountSaveBar
        dirty={dirty}
        pending={pending}
        onSave={handleSave}
        onReset={handleReset}
      />
    </div>
  );
}

function BillingStatus({
  billing,
  dirty,
}: {
  billing: AccountBilling;
  dirty: boolean;
}) {
  const { t, i18n } = useTranslation();

  const updated = billing.updatedAt
    ? t("billing.status.updatedAt", {
        date: formatDateTime(billing.updatedAt, i18n.language),
      })
    : t("billing.status.neverSaved");
  const pendingNote = dirty ? t("billing.status.unsaved") : null;

  if (billing.complete) {
    return (
      <Alert variant="success">
        <CircleCheck />
        <AlertTitle>{t("billing.status.complete")}</AlertTitle>
        <AlertDescription className="flex flex-col gap-1">
          <span>{t("billing.status.completeHint")}</span>
          <span className="text-xs">
            {[updated, pendingNote].filter(Boolean).join(". ")}
          </span>
        </AlertDescription>
      </Alert>
    );
  }

  const missing = billing.missingFields.map((field) =>
    t(`billing.fields.${field}`, { defaultValue: field })
  );

  return (
    <Alert variant="warning">
      <CircleAlert />
      <AlertTitle>{t("billing.status.incomplete")}</AlertTitle>
      <AlertDescription className="flex flex-col gap-1">
        {missing.length > 0 && <span>{missing.join(", ")}</span>}
        <span className="text-xs">
          {[updated, pendingNote].filter(Boolean).join(". ")}
        </span>
      </AlertDescription>
    </Alert>
  );
}
