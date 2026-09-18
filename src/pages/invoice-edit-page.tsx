import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowDown,
  ArrowUp,
  FileText,
  Plus,
  Receipt,
  Trash2,
  UserRound,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/page-header";
import { AdminGate } from "@/components/admin-gate";
import { SectionCard } from "@/components/section-card";
import { FormField } from "@/components/form-field";
import { DateField } from "@/components/date-field";
import { FormSaveBar } from "@/components/form-save-bar";
import { useDiscardGuard } from "@/components/discard-guard";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { BillingChoice } from "@/components/billing/billing-choice";
import { ClientPicker } from "@/components/clients/client-picker";
import { clientOption } from "@/components/clients/client-option";
import { InvoiceTotals } from "@/components/invoices/invoice-document";
import { useInvoiceError } from "@/components/invoices/use-invoice-error";
import {
  draftFormFrom,
  emptyLine,
  indicativeTotals,
  isDraftDirty,
  toUpdateInput,
  validateDraft,
  type DraftForm,
  type DraftLine,
} from "@/components/invoices/invoice-draft-form";
import { useToast } from "@/app/toast-context";
import { useBack } from "@/lib/use-back";
import { ApiError } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import { useAccountBilling } from "@/features/account";
import {
  INVOICE_LINE_DESCRIPTION_MAX,
  INVOICE_NOTES_MAX,
  INVOICE_VAT_RATES,
  formatEuro,
  formatVatRate,
  invoiceErrorCode,
  useInvoice,
  useUpdateInvoice,
  type Invoice,
} from "@/features/invoices";

const FORM_ID = "invoice-draft-form";

function DraftEditor({ invoice }: { invoice: Invoice }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const describeError = useInvoiceError();
  const updateInvoice = useUpdateInvoice();
  const billingQuery = useAccountBilling();
  const goBack = useBack(`/app/invoices/${invoice.id}`);

  const [baseline, setBaseline] = useState<DraftForm>(() =>
    draftFormFrom(invoice)
  );
  const [form, setForm] = useState<DraftForm>(baseline);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const billing = billingQuery.data;
  const franchise = billing?.vatRegime === "FRANCHISE";
  const companyVatRate = franchise ? 0 : (billing?.defaultVatRate ?? 0);
  const defaultLineRate = billing
    ? franchise
      ? "0"
      : billing.defaultVatRate != null
        ? String(billing.defaultVatRate)
        : ""
    : "";

  const dirty = isDraftDirty(form, baseline);
  const guard = useDiscardGuard({ dirty, onLeave: goBack });
  const totals = useMemo(
    () => indicativeTotals(form, companyVatRate),
    [form, companyVatRate]
  );
  const pending = updateInvoice.isPending;

  const setField = <K extends keyof DraftForm>(key: K, value: DraftForm[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    const errorKey = key === "customer" ? "customerId" : key;
    setErrors((previous) => ({ ...previous, [errorKey]: "" }));
  };

  const clearLineErrors = () =>
    setErrors((previous) =>
      Object.fromEntries(
        Object.entries(previous).filter(([key]) => !key.startsWith("lines"))
      )
    );

  const setLine = (index: number, patch: Partial<DraftLine>) => {
    setForm((previous) => ({
      ...previous,
      lines: previous.lines.map((line, position) =>
        position === index ? { ...line, ...patch } : line
      ),
    }));
    setErrors((previous) => {
      const next = { ...previous };
      for (const key of Object.keys(patch)) delete next[`lines[${index}].${key}`];
      return next;
    });
  };

  const addLine = () => {
    setForm((previous) => ({
      ...previous,
      lines: [...previous.lines, emptyLine(defaultLineRate)],
    }));
    setErrors((previous) => ({ ...previous, lines: "" }));
  };

  const removeLine = (index: number) => {
    setForm((previous) => ({
      ...previous,
      lines: previous.lines.filter((_, position) => position !== index),
    }));
    clearLineErrors();
  };

  const moveLine = (index: number, step: number) => {
    setForm((previous) => {
      const target = index + step;
      if (target < 0 || target >= previous.lines.length) return previous;
      const lines = [...previous.lines];
      [lines[index], lines[target]] = [lines[target], lines[index]];
      return { ...previous, lines };
    });
    clearLineErrors();
  };

  const save = () => {
    const clientErrors = validateDraft(form, t);
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length > 0) {
      toast.error(t("invoices.editor.errors.fix"));
      return;
    }
    updateInvoice.mutate(
      { id: invoice.id, input: toUpdateInput(form) },
      {
        onSuccess: (saved) => {
          const next = draftFormFrom(saved);
          setBaseline(next);
          setForm(next);
          setErrors({});
          toast.success(t("invoices.editor.saved"));
        },
        onError: (error) => {
          const code = invoiceErrorCode(error);
          if (code === "INVOICE_NOT_DRAFT") {
            toast.error(describeError(error));
            navigate(`/app/invoices/${invoice.id}`, { replace: true });
            return;
          }
          if (error instanceof ApiError) {
            const fieldErrors = error.structuredFieldErrors;
            if (Object.keys(fieldErrors).length > 0) setErrors(fieldErrors);
          }
          toast.error(describeError(error, "invoices.errors.saveFailed"));
        },
      }
    );
  };

  const vatOptions = INVOICE_VAT_RATES.map((rate) => ({
    value: String(rate),
    label: formatVatRate(rate),
  }));

  const lineErrorsGlobal = errors.lines;

  return (
    <div className="flex w-full flex-1 flex-col">
      <PageHeader
        title={t("invoices.editor.title")}
        subtitle={form.customer?.name || undefined}
        backFallback={`/app/invoices/${invoice.id}`}
        onBack={guard.requestLeave}
      />

      <form
        id={FORM_ID}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
        className="flex flex-1 flex-col gap-4"
      >
        {franchise && (
          <Alert>
            <Receipt />
            <AlertDescription>{t("invoices.editor.franchiseHint")}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 items-start gap-4 2xl:grid-cols-[360px_minmax(0,1fr)]">
          <SectionCard
            title={t("invoices.editor.general")}
            icon={UserRound}
            contentClassName="flex flex-col gap-1"
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="invoice-draft-customer">
                {t("invoices.fields.customer")}
                <span className="ml-0.5 text-destructive">*</span>
              </Label>
              <ClientPicker
                id="invoice-draft-customer"
                value={form.customer}
                onChange={(customer) =>
                  setField(
                    "customer",
                    customer ? clientOption(customer) : null
                  )
                }
                disabled={pending}
                invalid={Boolean(errors.customerId)}
              />
              <p
                id="invoice-draft-customer-message"
                role={errors.customerId ? "alert" : undefined}
                className="min-h-4 text-xs leading-4 text-destructive"
              >
                {errors.customerId ?? ""}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-x-3 sm:grid-cols-2 2xl:grid-cols-1">
              <FormField
                label={t("invoices.fields.serviceStartDate")}
                htmlFor="invoice-draft-start"
                error={errors.serviceStartDate}
              >
                <DateField
                  id="invoice-draft-start"
                  value={form.serviceStartDate}
                  max={form.serviceEndDate || undefined}
                  onChange={(value) => setField("serviceStartDate", value)}
                  disabled={pending}
                  className="min-h-11 lg:min-h-10"
                />
              </FormField>
              <FormField
                label={t("invoices.fields.serviceEndDate")}
                htmlFor="invoice-draft-end"
                error={errors.serviceEndDate}
              >
                <DateField
                  id="invoice-draft-end"
                  value={form.serviceEndDate}
                  min={form.serviceStartDate || undefined}
                  onChange={(value) => setField("serviceEndDate", value)}
                  disabled={pending}
                  className="min-h-11 lg:min-h-10"
                />
              </FormField>
            </div>
            <FormField
              label={t("invoices.fields.notes")}
              htmlFor="invoice-draft-notes"
              error={errors.notes}
              hint={t("invoices.editor.count", {
                count: form.notes.length,
                max: INVOICE_NOTES_MAX,
              })}
            >
              <Textarea
                id="invoice-draft-notes"
                rows={4}
                value={form.notes}
                maxLength={INVOICE_NOTES_MAX}
                onChange={(event) => setField("notes", event.target.value)}
                disabled={pending}
                aria-describedby="invoice-draft-notes-message"
              />
            </FormField>
          </SectionCard>

          <SectionCard
            title={t("invoices.detail.lines")}
            icon={FileText}
            extra={
              <Button
                type="button"
                variant="outline"
                className="min-h-11 shrink-0 lg:min-h-9"
                disabled={pending}
                onClick={addLine}
              >
                <Plus className="size-4" />
                <span className="sr-only sm:not-sr-only">
                  {t("invoices.editor.addLine")}
                </span>
              </Button>
            }
            contentClassName="flex flex-col gap-4"
          >
            {lineErrorsGlobal && (
              <p role="alert" className="text-sm text-destructive">
                {lineErrorsGlobal}
              </p>
            )}

            {form.lines.length === 0 ? (
              <EmptyState
                message={t("invoices.editor.noLines")}
                icon={<FileText className="size-8" />}
              />
            ) : (
              <>
                <div className="hidden grid-cols-[minmax(0,1fr)_88px_120px_128px_104px_120px] gap-2 text-xs font-medium text-muted-foreground lg:grid">
                  <span>{t("invoices.lines.description")}</span>
                  <span className="text-right">{t("invoices.lines.quantity")}</span>
                  <span className="text-right">
                    {t("invoices.lines.unitPriceHt")}
                  </span>
                  <span>{t("invoices.lines.vatRate")}</span>
                  <span className="text-right">{t("invoices.lines.totalHt")}</span>
                  <span className="sr-only">{t("common.actions")}</span>
                </div>
                <ol className="flex flex-col gap-3 lg:gap-2">
                  {form.lines.map((line, index) => {
                    const prefix = `lines[${index}]`;
                    const error = (field: string) => errors[`${prefix}.${field}`];
                    const lineTotal = totals.lineTotals[index];
                    const lineMessages = [
                      error("description"),
                      error("quantity"),
                      error("unitPriceHt"),
                      error("vatRate"),
                    ].filter(Boolean);
                    return (
                      <li
                        key={line.key}
                        className="flex flex-col gap-2 rounded-lg border border-border p-3 lg:border-0 lg:p-0"
                      >
                        <div className="grid grid-cols-2 gap-2 lg:grid-cols-[minmax(0,1fr)_88px_120px_128px_104px_120px] lg:items-start">
                          <div className="col-span-2 flex flex-col gap-1 lg:col-span-1">
                            <Label
                              htmlFor={`${prefix}-description`}
                              className="lg:sr-only"
                            >
                              {t("invoices.lines.description")}
                            </Label>
                            <Textarea
                              id={`${prefix}-description`}
                              rows={2}
                              value={line.description}
                              maxLength={INVOICE_LINE_DESCRIPTION_MAX}
                              onChange={(event) =>
                                setLine(index, { description: event.target.value })
                              }
                              disabled={pending}
                              aria-invalid={error("description") ? true : undefined}
                              className={cn(
                                "min-h-10",
                                error("description") && "border-destructive"
                              )}
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <Label
                              htmlFor={`${prefix}-quantity`}
                              className="lg:sr-only"
                            >
                              {t("invoices.lines.quantity")}
                            </Label>
                            <Input
                              id={`${prefix}-quantity`}
                              inputMode="decimal"
                              value={line.quantity}
                              onChange={(event) =>
                                setLine(index, { quantity: event.target.value })
                              }
                              disabled={pending}
                              aria-invalid={error("quantity") ? true : undefined}
                              className={cn(
                                "min-h-11 text-right tabular-nums lg:min-h-10",
                                error("quantity") && "border-destructive"
                              )}
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <Label
                              htmlFor={`${prefix}-price`}
                              className="lg:sr-only"
                            >
                              {t("invoices.lines.unitPriceHt")}
                            </Label>
                            <Input
                              id={`${prefix}-price`}
                              inputMode="decimal"
                              value={line.unitPriceHt}
                              onChange={(event) =>
                                setLine(index, { unitPriceHt: event.target.value })
                              }
                              disabled={pending}
                              aria-invalid={error("unitPriceHt") ? true : undefined}
                              className={cn(
                                "min-h-11 text-right tabular-nums lg:min-h-10",
                                error("unitPriceHt") && "border-destructive"
                              )}
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <Label
                              htmlFor={`${prefix}-vat`}
                              className="lg:sr-only"
                            >
                              {t("invoices.lines.vatRate")}
                            </Label>
                            <BillingChoice
                              id={`${prefix}-vat`}
                              value={line.vatRate}
                              options={vatOptions}
                              onChange={(value) => setLine(index, { vatRate: value })}
                              disabled={pending}
                              invalid={Boolean(error("vatRate"))}
                              placeholder={t("invoices.editor.companyRate")}
                              emptyLabel={t("invoices.editor.companyRate")}
                              className="min-h-11 lg:min-h-10"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium leading-none lg:sr-only">
                              {t("invoices.lines.totalHt")}
                            </span>
                            <span className="flex min-h-11 items-center justify-end text-sm font-medium tabular-nums text-foreground lg:min-h-10">
                              {lineTotal == null ? "-" : formatEuro(lineTotal)}
                            </span>
                          </div>
                          <div className="col-span-2 flex items-center justify-end gap-1 lg:col-span-1 lg:self-start">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-11 lg:size-9"
                              disabled={pending || index === 0}
                              aria-label={t("invoices.editor.moveUp")}
                              title={t("invoices.editor.moveUp")}
                              onClick={() => moveLine(index, -1)}
                            >
                              <ArrowUp className="size-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-11 lg:size-9"
                              disabled={pending || index === form.lines.length - 1}
                              aria-label={t("invoices.editor.moveDown")}
                              title={t("invoices.editor.moveDown")}
                              onClick={() => moveLine(index, 1)}
                            >
                              <ArrowDown className="size-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-11 lg:size-9"
                              disabled={pending}
                              aria-label={t("invoices.editor.removeLine")}
                              title={t("invoices.editor.removeLine")}
                              onClick={() => removeLine(index)}
                            >
                              <Trash2 className="size-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        {lineMessages.length > 0 && (
                          <p role="alert" className="text-xs text-destructive">
                            {lineMessages.join(" ")}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </>
            )}

            {dirty ? (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-muted-foreground">
                  {t("invoices.editor.indicative")}
                </p>
                <dl className="flex w-full flex-col gap-1 self-end rounded-lg bg-muted/50 p-3 sm:w-64">
                  <div className="flex justify-between gap-3 text-sm">
                    <dt className="text-muted-foreground">{t("invoices.totals.ht")}</dt>
                    <dd className="tabular-nums">{formatEuro(totals.totalHt)}</dd>
                  </div>
                  <div className="flex justify-between gap-3 text-sm">
                    <dt className="text-muted-foreground">{t("invoices.totals.vat")}</dt>
                    <dd className="tabular-nums">{formatEuro(totals.totalVat)}</dd>
                  </div>
                  <div className="mt-1 flex justify-between gap-3 border-t border-border pt-2">
                    <dt className="text-sm font-medium">{t("invoices.totals.ttc")}</dt>
                    <dd className="text-lg font-semibold tabular-nums">
                      {formatEuro(totals.totalTtc)}
                    </dd>
                  </div>
                </dl>
              </div>
            ) : (
              <InvoiceTotals invoice={invoice} />
            )}
          </SectionCard>
        </div>

        <div className="flex-1" />

        <FormSaveBar
          dirty={dirty}
          pending={pending}
          formId={FORM_ID}
          onCancel={guard.requestLeave}
          cancelLabel={t("common.back")}
          status={dirty ? t("invoices.editor.dirtyStatus") : undefined}
        />
      </form>

      {guard.dialog}
    </div>
  );
}

function InvoiceEditContent() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const invoiceQuery = useInvoice(id);
  const invoice = invoiceQuery.data;

  if (invoiceQuery.isLoading) return <LoadingState />;
  if (invoiceQuery.isError || !invoice) {
    const notFound =
      invoiceQuery.error instanceof ApiError &&
      invoiceQuery.error.status === 404;
    return notFound ? (
      <EmptyState
        message={t("invoices.errors.notFound")}
        icon={<Receipt className="size-8" />}
        className="flex-1"
      />
    ) : (
      <ErrorState
        error={invoiceQuery.error}
        retrying={invoiceQuery.isFetching}
        onRetry={() => void invoiceQuery.refetch()}
      />
    );
  }

  if (invoice.status !== "DRAFT") {
    return (
      <div className="flex flex-1 flex-col">
        <PageHeader
          title={t("invoices.editor.title")}
          backFallback={`/app/invoices/${invoice.id}`}
        />
        <EmptyState
          message={t("invoices.editor.notDraft")}
          icon={<Receipt className="size-8" />}
          className="flex-1"
          action={
            <Button asChild variant="outline" className="min-h-11 lg:min-h-10">
              <Link to={`/app/invoices/${invoice.id}`}>
                {t("invoices.editor.openInvoice")}
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  return <DraftEditor key={invoice.id} invoice={invoice} />;
}

export function InvoiceEditPage() {
  return (
    <AdminGate>
      <InvoiceEditContent />
    </AdminGate>
  );
}
