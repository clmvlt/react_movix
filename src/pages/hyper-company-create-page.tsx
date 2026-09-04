import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Loader2, Power, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { HyperadminGate } from "@/components/admin-gate";
import { SectionCard } from "@/components/section-card";
import { SwitchRow } from "@/components/field-row";
import { FormSaveBar } from "@/components/form-save-bar";
import { FormField } from "@/components/form-field";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDiscardGuard } from "@/components/discard-guard";
import { AdminAccountSections } from "@/components/hyperadmin/admin-account-sections";
import { useHyperError } from "@/components/hyperadmin/use-hyper-error";
import {
  adminAccountFieldErrors,
  buildAdminAccountCreate,
  emptyAdminAccountForm,
  validateAdminAccount,
  type AdminAccountFormErrors,
  type AdminAccountFormState,
} from "@/components/hyperadmin/admin-account-form";
import { useToast } from "@/app/toast-context";
import { ApiError, apiErrorText } from "@/lib/api-error";
import { useBack } from "@/lib/use-back";
import {
  useCreateAdminAccount,
  useUpdateAdminAccount,
  type AdminAccount,
} from "@/features/admin-accounts";
import { useAddAccountMember } from "@/features/members";

const COMPANIES_PATH = "/app/hyperadmin?tab=companies";
const FORM_ID = "hyper-company-create";

export function HyperCompanyCreatePage() {
  return (
    <HyperadminGate>
      <HyperCompanyCreateContent />
    </HyperadminGate>
  );
}

function HyperCompanyCreateContent() {
  const { t } = useTranslation();
  const toast = useToast();
  const errorMessage = useHyperError();
  const goBack = useBack(COMPANIES_PATH);

  const createAccount = useCreateAdminAccount();
  const updateAccount = useUpdateAdminAccount();

  const [form, setForm] = useState<AdminAccountFormState>(() =>
    emptyAdminAccountForm()
  );
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<AdminAccountFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [created, setCreated] = useState<AdminAccount | null>(null);

  const pending = createAccount.isPending || updateAccount.isPending;
  const dirty = !created && form.societe.trim() !== "";

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

  const applyApiError = (error: unknown) => {
    if (error instanceof ApiError) {
      const fieldErrors = adminAccountFieldErrors(error.fieldErrors);
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
        return;
      }
    }
    const text = apiErrorText(error);
    setFormError(
      text ?? errorMessage(error, "hyperadmin.companies.errors.createFailed")
    );
  };

  const uploadLogo = (account: AdminAccount) => {
    if (form.logo.kind !== "replace") {
      setCreated(account);
      return;
    }
    updateAccount.mutate(
      {
        accountId: account.id,
        input: {
          anomaliesEmails: account.anomaliesEmails,
          logo: form.logo.dataUrl,
        },
      },
      {
        onSuccess: (updated) => setCreated(updated),
        onError: (error) => {
          setCreated(account);
          toast.warning(
            errorMessage(error, "hyperadmin.companies.errors.logoFailed")
          );
        },
      }
    );
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    const nextErrors = validateAdminAccount(form, "create", t);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const input = buildAdminAccountCreate(form);
    if (!isActive) input.isActive = false;

    createAccount.mutate(input, {
      onSuccess: (account) => {
        toast.success(
          t("hyperadmin.companies.created", { societe: account.societe })
        );
        uploadLogo(account);
      },
      onError: applyApiError,
    });
  };

  if (created) {
    return <CreatedPanel account={created} />;
  }

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title={t("hyperadmin.companies.createTitle")}
        subtitle={t("hyperadmin.companies.createSubtitle")}
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
          mode="create"
          idPrefix="create"
        />

        <SectionCard
          title={t("hyperadmin.companies.sections.status")}
          description={t("hyperadmin.companies.sections.statusHint")}
          icon={Power}
        >
          <SwitchRow
            id="create-isActive"
            icon={Power}
            label={t("hyperadmin.companies.activeLabel")}
            summary={t("hyperadmin.companies.activeHint")}
            checked={isActive}
            onCheckedChange={setIsActive}
            disabled={pending}
          />
        </SectionCard>
      </form>

      <FormSaveBar
        className="mt-4"
        dirty
        pending={pending}
        formId={FORM_ID}
        onCancel={guard.requestLeave}
        saveLabel={t("hyperadmin.companies.createAction")}
      />
      {guard.dialog}
    </div>
  );
}

function CreatedPanel({ account }: { account: AdminAccount }) {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const errorMessage = useHyperError();
  const addMember = useAddAccountMember();

  const [email, setEmail] = useState("");
  const [asAdmin, setAsAdmin] = useState(true);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [addedEmail, setAddedEmail] = useState<string | null>(null);

  const handleAdd = (event: FormEvent) => {
    event.preventDefault();
    setEmailError(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError(t("hyperadmin.members.emailRequired"));
      return;
    }
    addMember.mutate(
      { accountId: account.id, input: { email: trimmed, isAdmin: asAdmin } },
      {
        onSuccess: () => {
          setAddedEmail(trimmed);
          setEmail("");
          toast.success(t("hyperadmin.members.added", { email: trimmed }));
        },
        onError: (error) => {
          if (error instanceof ApiError && error.status === 404) {
            setEmailError(t("hyperadmin.members.noUser"));
          } else if (error instanceof ApiError && error.status === 409) {
            setEmailError(t("hyperadmin.members.userAlreadyMember"));
          } else {
            toast.error(
              errorMessage(error, "hyperadmin.companies.errors.memberFailed")
            );
          }
        },
      }
    );
  };

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title={t("hyperadmin.companies.createdTitle")}
        subtitle={account.societe}
        backFallback={COMPANIES_PATH}
      />

      <div className="flex flex-col gap-4">
        <Alert variant="success">
          <CheckCircle2 />
          <AlertTitle>
            {t("hyperadmin.companies.created", { societe: account.societe })}
          </AlertTitle>
          <AlertDescription>
            {account.code
              ? t("hyperadmin.companies.createdCode", { code: account.code })
              : t("hyperadmin.companies.codeGenerated")}
          </AlertDescription>
        </Alert>

        <SectionCard
          title={t("hyperadmin.companies.firstMemberTitle")}
          description={t("hyperadmin.companies.firstMemberHint")}
          icon={UserPlus}
          contentClassName="flex flex-col gap-3"
        >
          {addedEmail && (
            <Alert variant="success">
              <CheckCircle2 />
              <AlertDescription>
                {t("hyperadmin.members.added", { email: addedEmail })}
              </AlertDescription>
            </Alert>
          )}
          <form
            onSubmit={handleAdd}
            noValidate
            className="flex flex-col gap-3 sm:max-w-md"
          >
            <FormField
              label={t("common.email")}
              htmlFor="created-member-email"
              error={emailError ?? undefined}
            >
              <Input
                id="created-member-email"
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setEmailError(null);
                }}
                autoComplete="off"
                className="min-h-11 lg:min-h-10"
              />
            </FormField>
            <SwitchRow
              id="created-member-admin"
              icon={UserPlus}
              label={t("profiles.access.admin")}
              summary={t("hyperadmin.companies.firstMemberAdminHint")}
              checked={asAdmin}
              onCheckedChange={setAsAdmin}
              disabled={addMember.isPending}
            />
            <Button
              type="submit"
              className="min-h-11 sm:w-fit lg:min-h-10"
              disabled={addMember.isPending}
            >
              {addMember.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <UserPlus className="size-4" />
              )}
              {t("hyperadmin.members.addAction")}
            </Button>
          </form>
        </SectionCard>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            className="min-h-11 lg:min-h-10"
            onClick={() => navigate(`/app/hyperadmin/companies/${account.id}`)}
          >
            {t("hyperadmin.companies.openCompany")}
          </Button>
          <Button
            asChild
            variant="outline"
            className="min-h-11 lg:min-h-10"
          >
            <Link to={COMPANIES_PATH}>
              {t("hyperadmin.companies.backToList")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
