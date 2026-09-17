import {
  BILLING_LATE_PENALTY_MAX,
  BILLING_PAYMENT_TERM_MAX,
  RCS_FORMS,
  SHARE_CAPITAL_FORMS,
  type AccountBilling,
  type AccountBillingInput,
  type LegalForm,
  type VatRegime,
} from "@/features/account";

type Translate = (key: string, options?: Record<string, unknown>) => string;

export interface BillingFormState {
  legalName: string;
  legalForm: LegalForm | "";
  shareCapital: string;
  siret: string;
  rcsCity: string;
  apeCode: string;
  vatNumber: string;
  vatRegime: VatRegime | "";
  vatOnDebits: boolean;
  defaultVatRate: string;
  address1: string;
  address2: string;
  postalCode: string;
  city: string;
  email: string;
  phone: string;
  iban: string;
  bic: string;
  paymentTermDays: string;
  latePenaltyRate: string;
  earlyPaymentDiscount: string;
  invoicePrefix: string;
  invoiceFooter: string;
}

export type BillingFormErrors = Partial<Record<keyof BillingFormState, string>>;

const SIRET_PATTERN = /^\d{14}$/;
const POSTAL_CODE_PATTERN = /^\d{5}$/;
const INTEGER_PATTERN = /^\d+$/;

function text(value: string | null | undefined): string {
  return value ?? "";
}

function numberText(value: number | null | undefined): string {
  return value == null ? "" : String(value);
}

export function billingFormFrom(billing: AccountBilling): BillingFormState {
  return {
    legalName: text(billing.legalName),
    legalForm: billing.legalForm ?? "",
    shareCapital: numberText(billing.shareCapital),
    siret: text(billing.siret),
    rcsCity: text(billing.rcsCity),
    apeCode: text(billing.apeCode),
    vatNumber: text(billing.vatNumber),
    vatRegime: billing.vatRegime ?? "",
    vatOnDebits: billing.vatOnDebits === true,
    defaultVatRate: numberText(billing.defaultVatRate),
    address1: text(billing.address1),
    address2: text(billing.address2),
    postalCode: text(billing.postalCode),
    city: text(billing.city),
    email: text(billing.email),
    phone: text(billing.phone),
    iban: text(billing.iban),
    bic: text(billing.bic),
    paymentTermDays: numberText(billing.paymentTermDays),
    latePenaltyRate: numberText(billing.latePenaltyRate),
    earlyPaymentDiscount: text(billing.earlyPaymentDiscount),
    invoicePrefix: text(billing.invoicePrefix),
    invoiceFooter: text(billing.invoiceFooter),
  };
}

function nullableText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed || null;
}

function parseDecimal(value: string): number | null {
  const trimmed = value.trim().replace(/\s/g, "").replace(",", ".");
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function isFranchise(form: BillingFormState): boolean {
  return form.vatRegime === "FRANCHISE";
}

export function needsShareCapital(form: BillingFormState): boolean {
  return form.legalForm !== "" && SHARE_CAPITAL_FORMS.includes(form.legalForm);
}

export function needsRcsCity(form: BillingFormState): boolean {
  return form.legalForm !== "" && RCS_FORMS.includes(form.legalForm);
}

export function toBillingInput(form: BillingFormState): AccountBillingInput {
  const franchise = isFranchise(form);
  return {
    legalName: nullableText(form.legalName),
    legalForm: form.legalForm || null,
    shareCapital: parseDecimal(form.shareCapital),
    siret: nullableText(form.siret),
    rcsCity: nullableText(form.rcsCity),
    apeCode: nullableText(form.apeCode),
    vatNumber: nullableText(form.vatNumber),
    vatRegime: form.vatRegime || null,
    vatOnDebits: franchise ? false : form.vatOnDebits,
    defaultVatRate: franchise ? null : parseDecimal(form.defaultVatRate),
    address1: nullableText(form.address1),
    address2: nullableText(form.address2),
    postalCode: nullableText(form.postalCode),
    city: nullableText(form.city),
    email: nullableText(form.email),
    phone: nullableText(form.phone),
    iban: nullableText(form.iban),
    bic: nullableText(form.bic),
    paymentTermDays: parseDecimal(form.paymentTermDays),
    latePenaltyRate: parseDecimal(form.latePenaltyRate),
    earlyPaymentDiscount: nullableText(form.earlyPaymentDiscount),
    invoicePrefix: nullableText(form.invoicePrefix),
    invoiceFooter: nullableText(form.invoiceFooter),
  };
}

export function isBillingDirty(
  form: BillingFormState,
  baseline: AccountBilling
): boolean {
  const current = comparable(form);
  const saved = comparable(billingFormFrom(baseline));
  return (Object.keys(current) as (keyof BillingFormState)[]).some(
    (key) => current[key] !== saved[key]
  );
}

function comparable(form: BillingFormState): BillingFormState {
  const franchise = isFranchise(form);
  const trimmed = Object.fromEntries(
    Object.entries(form).map(([key, value]) => [
      key,
      typeof value === "string" ? value.trim() : value,
    ])
  ) as unknown as BillingFormState;
  return {
    ...trimmed,
    vatOnDebits: franchise ? false : form.vatOnDebits,
    defaultVatRate: franchise ? "" : trimmed.defaultVatRate,
  };
}

export function digitsOnly(value: string): string {
  return value.replace(/\s/g, "");
}

export function sirenFromSiret(siret: string): string | null {
  const digits = digitsOnly(siret);
  return SIRET_PATTERN.test(digits) ? digits.slice(0, 9) : null;
}

export function vatNumberFromSiren(siren: string): string {
  const key = (12 + 3 * (Number(siren) % 97)) % 97;
  return `FR${String(key).padStart(2, "0")}${siren}`;
}

export function formatSiren(siren: string): string {
  return siren.replace(/(\d{3})(?=\d)/g, "$1 ");
}

export function validateBillingForm(
  form: BillingFormState,
  t: Translate
): BillingFormErrors {
  const errors: BillingFormErrors = {};

  const siret = digitsOnly(form.siret);
  if (siret && !SIRET_PATTERN.test(siret)) {
    errors.siret = t("billing.errors.siret");
  }

  const postalCode = form.postalCode.trim();
  if (postalCode && !POSTAL_CODE_PATTERN.test(postalCode)) {
    errors.postalCode = t("billing.errors.postalCode");
  }

  const term = form.paymentTermDays.trim();
  if (
    term &&
    (!INTEGER_PATTERN.test(term) || Number(term) > BILLING_PAYMENT_TERM_MAX)
  ) {
    errors.paymentTermDays = t("billing.errors.paymentTermDays", {
      max: BILLING_PAYMENT_TERM_MAX,
    });
  }

  const capital = form.shareCapital.trim();
  if (capital) {
    const parsed = parseDecimal(capital);
    if (parsed === null || parsed < 0) {
      errors.shareCapital = t("billing.errors.shareCapital");
    }
  }

  const penalty = form.latePenaltyRate.trim();
  if (penalty) {
    const parsed = parseDecimal(penalty);
    if (parsed === null || parsed < 0 || parsed > BILLING_LATE_PENALTY_MAX) {
      errors.latePenaltyRate = t("billing.errors.latePenaltyRate", {
        max: BILLING_LATE_PENALTY_MAX,
      });
    }
  }

  return errors;
}
