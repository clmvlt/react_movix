import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Building2, Power, ShieldAlert, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { HyperadminGate } from "@/components/admin-gate";
import { SectionCard } from "@/components/section-card";
import { SwitchRow } from "@/components/field-row";
import { FormSaveBar } from "@/components/form-save-bar";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDiscardGuard } from "@/components/discard-guard";
import { AdminAccountSections } from "@/components/hyperadmin/admin-account-sections";
import { AccountDeleteDialog } from "@/components/hyperadmin/account-delete-dialog";
import { AccountStatusDialog } from "@/components/hyperadmin/account-status-dialog";
import { useHyperError } from "@/components/hyperadmin/use-hyper-error";
import {
  adminAccountFieldErrors,
  buildAdminAccountUpdate,
  initialAdminAccountForm,
  isAdminAccountDirty,
  validateAdminAccount,
  type AdminAccountFormErrors,
  type AdminAccountFormState,
} from "@/components/hyperadmin/admin-account-form";
import { useToast } from "@/app/toast-context";
import { ApiError, apiErrorText } from "@/lib/api-error";
import { formatDateTime } from "@/lib/date";
import { useBack } from "@/lib/use-back";
import {
  useAdminAccount,
  useUpdateAdminAccount,
  type AdminAccount,
} from "@/features/admin-accounts";

const COMPANIES_PATH = "/app/hyperadmin?tab=companies";
const FORM_ID = "hyper-company-edit";

export function HyperCompanyEditPage() {
  return (
    <HyperadminGate>
      <HyperCompanyEditContent />
    </HyperadminGate>
  );
}

function HyperCompanyEditContent() {
  const { t } = useTranslation();
  const { accountId = "" } = useParams();
  const accountQuery = useAdminAccount(accountId);

  const notFound =
    accountQuery.error instanceof ApiError && accountQuery.error.status === 404;

  if (accountQuery.isLoading) {
    return (
      <div className="flex flex-1 flex-col">
        <PageHeader
          title={t("hyperadmin.companies.editTitle")}
          backFallback={COMPANIES_PATH}
        />
        <LoadingState />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex flex-1 flex-col">
        <PageHeader
          title={t("hyperadmin.companies.editTitle")}
          backFallback={COMPANIES_PATH}
        />
        <EmptyState
          message={t("hyperadmin.companies.notFound")}
          icon={<Building2 className="size-8" />}
          className="flex-1"
          action={
            <Button asChild variant="outline" className="min-h-11 lg:min-h-10">
              <Link to={COMPANIES_PATH}>
                {t("hyperadmin.companies.backToList")}
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  if (accountQuery.isError || !accountQuery.data) {
    return (
      <div className="flex flex-1 flex-col">
        <PageHeader
          title={t("hyperadmin.companies.editTitle")}
          backFallback={COMPANIES_PATH}
        />
        <ErrorState
          error={accountQuery.error}
          retrying={accountQuery.isFetching}
          onRetry={() => void accountQuery.refetch()}
        />
      </div>
    );
  }

  return (
    <CompanyEditView key={accountQuery.data.id} account={accountQuery.data} />
  );
}

function CompanyEditView({ account }: { account: AdminAccount }) {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const errorMessage = useHyperError();
  const goBack = useBack(COMPANIES_PATH);
  const updateAccount = useUpdateAdminAccount();

  const [baseline, setBaseline] = useState<AdminAccount>(account);
  const [form, setForm] = useState<AdminAccountFormState>(() =>
    initialAdminAccountForm(account)
  );
  const [errors, setErrors] = useState<AdminAccountFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [statusOpen, setStatusOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const dirty = isAdminAccountDirty(form, baseline);
  const pending = updateAccount.isPending;
  const active = account.isActive !== false;

  const set = <K extends keyof AdminAccountFormState>(
    key: K,
    value: AdminAccountFormState[K]
  ) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => {
      if (!(key in previous)) return previous;
      const next = { ...previous };
      delete next[key as string];
      return next;
    });
  };

  const guard = useDiscardGuard({ dirty, onLeave: goBack });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    const nextErrors = validateAdminAccount(form, "edit", t);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    updateAccount.mutate(
      { accountId: baseline.id, input: buildAdminAccountUpdate(form, baseline) },
      {
        onSuccess: (updated) => {
          setBaseline(updated);
          setForm(initialAdminAccountForm(updated));
          toast.success(t("hyperadmin.companies.saved"));
        },
        onError: (error) => {
          if (error instanceof ApiError) {
            const fieldErrors = adminAccountFieldErrors(error.fieldErrors);
            if (Object.keys(fieldErrors).length > 0) {
              setErrors(fieldErrors);
              return;
            }
          }
          setFormError(
            apiErrorText(error) ??
              errorMessage(error, "hyperadmin.companies.errors.saveFailed")
          );
        },
      }
    );
  };

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title={account.societe}
        titleExtra={
          !active ? (
            <Badge variant="outline" className="text-destructive">
              {t("hyperadmin.companies.filters.inactive")}
            </Badge>
          ) : undefined
        }
        subtitle={
          account.updatedAt
            ? t("hyperadmin.companies.updatedOn", {
                date: formatDateTime(account.updatedAt, i18n.language),
              })
            : t("hyperadmin.companies.editSubtitle")
        }
        backFallback={COMPANIES_PATH}
        onBack={guard.requestLeave}
      />

      <form
        id={FORM_ID}
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-1 flex-col gap-4"
      >
        {formError && (
          <Alert variant="destructive">
            <AlertDescription className="whitespace-pre-line">
              {formError}
            </AlertDescription>
          </Alert>
        )}

        <AdminAccountSections
          form={form}
          errors={errors}
          set={set}
          disabled={pending}
          mode="edit"
          idPrefix="edit"
          account={baseline}
        />
      </form>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SectionCard
          title={t("hyperadmin.companies.sections.status")}
          description={t("hyperadmin.companies.sections.statusHint")}
          icon={Power}
          contentClassName="flex flex-col gap-3"
        >
          <SwitchRow
            id="edit-isActive"
            icon={Power}
            label={t("hyperadmin.companies.activeLabel")}
            summary={
              active
                ? t("hyperadmin.companies.activeHint")
                : t("hyperadmin.companies.inactiveHint")
            }
            checked={active}
            onCheckedChange={() => setStatusOpen(true)}
          />
          <p className="text-xs leading-4 text-muted-foreground">
            {t("hyperadmin.companies.statusImmediate")}
          </p>
        </SectionCard>

        <SectionCard
          title={t("hyperadmin.companies.delete.sectionTitle")}
          description={t("hyperadmin.companies.delete.sectionHint")}
          icon={ShieldAlert}
          contentClassName="flex flex-col gap-3"
        >
          <Alert variant="warning">
            <ShieldAlert />
            <AlertDescription>
              {t("hyperadmin.companies.delete.preferDisableHint")}
            </AlertDescription>
          </Alert>
          <Button
            type="button"
            variant="destructive"
            className="min-h-11 sm:w-fit lg:min-h-10"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="size-4" />
            {t("hyperadmin.companies.delete.action")}
          </Button>
        </SectionCard>
      </div>

      <FormSaveBar
        className="mt-4"
        dirty={dirty}
        pending={pending}
        formId={FORM_ID}
        onCancel={guard.requestLeave}
      />
      {guard.dialog}

      <AccountStatusDialog
        target={
          statusOpen
            ? { id: account.id, societe: account.societe, isActive: active }
            : null
        }
        onClose={() => setStatusOpen(false)}
      />

      <AccountDeleteDialog
        target={
          deleteOpen ? { id: account.id, societe: account.societe } : null
        }
        onClose={() => setDeleteOpen(false)}
      />
    </div>
  );
}
