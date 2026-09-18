import { useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  BadgeCheck,
  FileDown,
  FileMinus,
  Loader2,
  Pencil,
  Receipt,
  Send,
  Trash2,
  TriangleAlert,
  Undo2,
  X,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { AdminGate } from "@/components/admin-gate";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { InvoiceStatusBadge } from "@/components/invoices/invoice-status-badge";
import {
  InvoiceLinesCard,
  InvoiceSideCards,
} from "@/components/invoices/invoice-document";
import {
  InvoiceCreditNoteDialog,
  InvoiceDeleteDialog,
  InvoiceIssueDialog,
  InvoicePaymentDialog,
} from "@/components/invoices/invoice-action-dialogs";
import { InvoiceProblemAlert } from "@/components/invoices/invoice-problem-alert";
import { useInvoiceError } from "@/components/invoices/use-invoice-error";
import { usePdfPreview } from "@/app/pdf-preview-context";
import { useToast } from "@/app/toast-context";
import { ApiError } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import {
  invoiceKeys,
  invoicePdfFilename,
  invoicesApi,
  useCancelInvoicePayment,
  useInvoice,
  useInvoiceGenerationNotice,
  type Invoice,
} from "@/features/invoices";

type DialogKind = "issue" | "payment" | "credit" | "delete" | null;

function GenerationNotice({ invoiceId }: { invoiceId: string }) {
  const { t } = useTranslation();
  const { notice, dismiss } = useInvoiceGenerationNotice(invoiceId);
  if (!notice) return null;
  const { excludedCommands, unpricedCommands } = notice;
  if (excludedCommands.length === 0 && unpricedCommands.length === 0) {
    return null;
  }

  return (
    <Alert variant="warning">
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-1 top-1 size-11 lg:size-8"
        aria-label={t("common.close")}
        onClick={dismiss}
      >
        <X className="size-4" />
      </Button>
      <TriangleAlert />
      <div className="flex flex-col gap-3 pr-10">
        {unpricedCommands.length > 0 && (
          <div>
            <AlertTitle>
              {t("invoices.generation.unpriced", {
                count: unpricedCommands.length,
              })}
            </AlertTitle>
            <AlertDescription>
              <ul className="mt-1 flex flex-col">
                {unpricedCommands.map((command) => (
                  <li key={command.commandId}>
                    <Link
                      to={`/app/commands/${command.commandId}`}
                      className="inline-flex min-h-10 items-center underline underline-offset-2"
                    >
                      {[command.pharmacyName, command.pharmacyCip]
                        .filter(Boolean)
                        .join(" - ") || command.commandId.slice(0, 8)}
                    </Link>
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </div>
        )}
        {excludedCommands.length > 0 && (
          <div>
            <AlertTitle>
              {t("invoices.generation.excluded", {
                count: excludedCommands.length,
              })}
            </AlertTitle>
            <AlertDescription>
              <ul className="mt-1 flex flex-col">
                {excludedCommands.map((command) => (
                  <li key={command.commandId}>
                    <Link
                      to={`/app/invoices/${command.invoiceId}`}
                      className="inline-flex min-h-10 items-center underline underline-offset-2"
                    >
                      {t("invoices.generation.excludedItem", {
                        pharmacy:
                          command.pharmacyName ?? command.commandId.slice(0, 8),
                        number:
                          command.invoiceNumber ?? t("invoices.draftLabel"),
                      })}
                    </Link>
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </div>
        )}
      </div>
    </Alert>
  );
}

function InvoiceDetailContent() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const describeError = useInvoiceError();
  const openPdfPreview = usePdfPreview();

  const invoiceQuery = useInvoice(id);
  const cancelPayment = useCancelInvoicePayment();
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [problem, setProblem] = useState<unknown>(null);

  const invoice = invoiceQuery.data;
  const notFound =
    invoiceQuery.error instanceof ApiError && invoiceQuery.error.status === 404;

  const showPdf = (target: Invoice) => {
    openPdfPreview({
      key: invoiceKeys.pdf(
        target.id,
        `${target.status}-${target.number ?? ""}-${target.totalTtc}`
      ),
      title: target.number
        ? t("invoices.pdf.title", { number: target.number })
        : t("invoices.pdf.draftTitle"),
      subtitle: target.customerName ?? undefined,
      filename: invoicePdfFilename(target),
      load: () => invoicesApi.pdf(target.id),
      describeError: (error) => describeError(error, "invoices.errors.pdfFailed"),
    });
  };

  const undoPayment = (target: Invoice) => {
    cancelPayment.mutate(target.id, {
      onSuccess: () => toast.success(t("invoices.payment.cancelled")),
      onError: (error) => toast.error(describeError(error)),
    });
  };

  const action = (
    key: string,
    label: string,
    icon: typeof Pencil,
    onClick: () => void,
    variant: "default" | "outline" = "outline",
    extra?: { destructive?: boolean; pending?: boolean }
  ) => {
    const Icon = icon;
    return (
      <Button
        key={key}
        variant={variant}
        className={cn(
          "min-h-11 shrink-0 gap-1.5 px-3 lg:min-h-10",
          variant === "default" && "order-first sm:order-none"
        )}
        disabled={extra?.pending}
        onClick={onClick}
      >
        {extra?.pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Icon
            className={extra?.destructive ? "size-4 text-destructive" : "size-4"}
          />
        )}
        {label}
      </Button>
    );
  };

  let actions: ReactNode = null;
  if (invoice) {
    const pdf = action("pdf", t("invoices.actions.pdf"), FileDown, () =>
      showPdf(invoice)
    );
    const credit = action(
      "credit",
      t("invoices.actions.creditNote"),
      FileMinus,
      () => setDialog("credit"),
      "outline",
      { destructive: true }
    );
    if (invoice.type === "CREDIT_NOTE" || invoice.status === "CANCELLED") {
      actions = pdf;
    } else if (invoice.status === "DRAFT") {
      actions = (
        <>
          {action("delete", t("common.delete"), Trash2, () => setDialog("delete"), "outline", {
            destructive: true,
          })}
          {pdf}
          {action("edit", t("invoices.actions.edit"), Pencil, () =>
            navigate(`/app/invoices/${invoice.id}/edit`)
          )}
          {action(
            "issue",
            t("invoices.actions.issue"),
            Send,
            () => {
              setProblem(null);
              setDialog("issue");
            },
            "default"
          )}
        </>
      );
    } else if (invoice.status === "ISSUED") {
      actions = (
        <>
          {credit}
          {pdf}
          {action(
            "pay",
            t("invoices.actions.markPaid"),
            BadgeCheck,
            () => setDialog("payment"),
            "default"
          )}
        </>
      );
    } else if (invoice.status === "PAID") {
      actions = (
        <>
          {credit}
          {action(
            "unpay",
            t("invoices.actions.cancelPayment"),
            Undo2,
            () => undoPayment(invoice),
            "outline",
            { pending: cancelPayment.isPending }
          )}
          {pdf}
        </>
      );
    }
  }

  const title = invoice
    ? invoice.number ??
      (invoice.type === "CREDIT_NOTE"
        ? t("invoices.types.CREDIT_NOTE")
        : t("invoices.pdf.draftTitle"))
    : t("invoices.detail.title");

  return (
    <div className="flex w-full flex-1 flex-col">
      <PageHeader
        title={title}
        titleExtra={invoice ? <InvoiceStatusBadge invoice={invoice} /> : undefined}
        subtitle={
          invoice
            ? [
                invoice.type === "CREDIT_NOTE"
                  ? t("invoices.types.CREDIT_NOTE")
                  : null,
                invoice.customerName,
              ]
                .filter(Boolean)
                .join(" - ")
            : undefined
        }
        backFallback="/app/invoices"
        actions={actions}
      />

      {invoiceQuery.isLoading ? (
        <LoadingState />
      ) : notFound ? (
        <EmptyState
          message={t("invoices.errors.notFound")}
          icon={<Receipt className="size-8" />}
          className="flex-1"
        />
      ) : invoiceQuery.isError || !invoice ? (
        <ErrorState
          error={invoiceQuery.error}
          retrying={invoiceQuery.isFetching}
          onRetry={() => void invoiceQuery.refetch()}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {problem !== null && (
            <InvoiceProblemAlert
              error={problem}
              onDismiss={() => setProblem(null)}
            />
          )}
          <GenerationNotice invoiceId={invoice.id} />
          {invoice.status === "DRAFT" && (
            <Alert>
              <Pencil />
              <AlertDescription>{t("invoices.detail.draftHint")}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <InvoiceLinesCard invoice={invoice} />
            <InvoiceSideCards invoice={invoice} />
          </div>

          <InvoiceIssueDialog
            open={dialog === "issue"}
            onOpenChange={(open) => setDialog(open ? "issue" : null)}
            invoice={invoice}
            onProblem={setProblem}
          />
          <InvoicePaymentDialog
            open={dialog === "payment"}
            onOpenChange={(open) => setDialog(open ? "payment" : null)}
            invoice={invoice}
          />
          <InvoiceCreditNoteDialog
            open={dialog === "credit"}
            onOpenChange={(open) => setDialog(open ? "credit" : null)}
            invoice={invoice}
            onCreated={(creditNote) =>
              navigate(`/app/invoices/${creditNote.id}`)
            }
            onProblem={setProblem}
          />
          <InvoiceDeleteDialog
            open={dialog === "delete"}
            onOpenChange={(open) => setDialog(open ? "delete" : null)}
            invoice={invoice}
            onDeleted={() => navigate("/app/invoices", { replace: true })}
          />
        </div>
      )}
    </div>
  );
}

export function InvoiceDetailPage() {
  return (
    <AdminGate>
      <InvoiceDetailContent />
    </AdminGate>
  );
}
