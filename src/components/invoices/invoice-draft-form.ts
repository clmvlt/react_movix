import type {
  Invoice,
  InvoiceLineInput,
  InvoiceUpdateInput,
} from "@/features/invoices";
import { INVOICE_LINE_DESCRIPTION_MAX, INVOICE_NOTES_MAX } from "@/features/invoices";

type Translate = (key: string, options?: Record<string, unknown>) => string;

export interface DraftLine {
  key: string;
  description: string;
  quantity: string;
  unitPriceHt: string;
  vatRate: string;
}

export interface DraftForm {
  customer: { id: string; name: string } | null;
  serviceStartDate: string;
  serviceEndDate: string;
  notes: string;
  lines: DraftLine[];
}

const QUANTITY_PATTERN = /^\d+([.,]\d{1,3})?$/;
const PRICE_PATTERN = /^-?\d+([.,]\d{1,2})?$/;

let lineSeed = 0;

export function newLineKey(): string {
  lineSeed += 1;
  return `line-${Date.now()}-${lineSeed}`;
}

function numberText(value: number | null | undefined): string {
  return value == null ? "" : String(value);
}

function parseNumber(value: string): number {
  return Number(value.trim().replace(",", "."));
}

export function draftFormFrom(invoice: Invoice): DraftForm {
  return {
    customer: invoice.customerId
      ? { id: invoice.customerId, name: invoice.customerName ?? "" }
      : null,
    serviceStartDate: invoice.serviceStartDate?.slice(0, 10) ?? "",
    serviceEndDate: invoice.serviceEndDate?.slice(0, 10) ?? "",
    notes: invoice.notes ?? "",
    lines: [...invoice.lines]
      .sort((a, b) => a.position - b.position)
      .map((line) => ({
        key: line.id,
        description: line.description,
        quantity: numberText(line.quantity),
        unitPriceHt: numberText(line.unitPriceHt),
        vatRate: numberText(line.vatRate),
      })),
  };
}

export function emptyLine(defaultVatRate: string): DraftLine {
  return {
    key: newLineKey(),
    description: "",
    quantity: "1",
    unitPriceHt: "",
    vatRate: defaultVatRate,
  };
}

function comparable(form: DraftForm) {
  return JSON.stringify({
    customer: form.customer?.id ?? null,
    serviceStartDate: form.serviceStartDate,
    serviceEndDate: form.serviceEndDate,
    notes: form.notes.trim(),
    lines: form.lines.map((line) => [
      line.description.trim(),
      line.quantity.trim(),
      line.unitPriceHt.trim(),
      line.vatRate,
    ]),
  });
}

export function isDraftDirty(form: DraftForm, baseline: DraftForm): boolean {
  return comparable(form) !== comparable(baseline);
}

export function validateDraft(
  form: DraftForm,
  t: Translate
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.customer) errors.customerId = t("common.required");
  if (
    form.serviceStartDate &&
    form.serviceEndDate &&
    form.serviceEndDate < form.serviceStartDate
  ) {
    errors.serviceEndDate = t("invoices.editor.errors.periodOrder");
  }
  if (form.notes.length > INVOICE_NOTES_MAX) {
    errors.notes = t("invoices.editor.errors.tooLong", {
      max: INVOICE_NOTES_MAX,
    });
  }
  form.lines.forEach((line, index) => {
    const prefix = `lines[${index}]`;
    const description = line.description.trim();
    if (!description) {
      errors[`${prefix}.description`] = t("common.required");
    } else if (description.length > INVOICE_LINE_DESCRIPTION_MAX) {
      errors[`${prefix}.description`] = t("invoices.editor.errors.tooLong", {
        max: INVOICE_LINE_DESCRIPTION_MAX,
      });
    }
    const quantity = line.quantity.trim();
    if (!QUANTITY_PATTERN.test(quantity) || parseNumber(quantity) <= 0) {
      errors[`${prefix}.quantity`] = t("invoices.editor.errors.quantity");
    }
    if (!PRICE_PATTERN.test(line.unitPriceHt.trim())) {
      errors[`${prefix}.unitPriceHt`] = t("invoices.editor.errors.price");
    }
  });
  return errors;
}

export function toUpdateInput(form: DraftForm): InvoiceUpdateInput {
  return {
    customerId: form.customer?.id ?? "",
    serviceStartDate: form.serviceStartDate || null,
    serviceEndDate: form.serviceEndDate || null,
    notes: form.notes.trim() || null,
    lines: form.lines.map(
      (line): InvoiceLineInput => ({
        description: line.description.trim(),
        quantity: parseNumber(line.quantity),
        unitPriceHt: parseNumber(line.unitPriceHt),
        vatRate: line.vatRate === "" ? null : Number(line.vatRate),
      })
    ),
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export interface IndicativeTotals {
  totalHt: number;
  totalVat: number;
  totalTtc: number;
  lineTotals: (number | null)[];
}

export function indicativeTotals(
  form: DraftForm,
  companyVatRate: number
): IndicativeTotals {
  const bases = new Map<number, number>();
  const lineTotals = form.lines.map((line) => {
    const quantity = parseNumber(line.quantity);
    const price = parseNumber(line.unitPriceHt);
    if (!Number.isFinite(quantity) || !Number.isFinite(price)) return null;
    const total = round2(quantity * price);
    const rate = line.vatRate === "" ? companyVatRate : Number(line.vatRate);
    bases.set(rate, (bases.get(rate) ?? 0) + total);
    return total;
  });
  let totalHt = 0;
  let totalVat = 0;
  for (const [rate, base] of bases) {
    totalHt += base;
    totalVat += round2((base * rate) / 100);
  }
  totalHt = round2(totalHt);
  totalVat = round2(totalVat);
  return { totalHt, totalVat, totalTtc: round2(totalHt + totalVat), lineTotals };
}
