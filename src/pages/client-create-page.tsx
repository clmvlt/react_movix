import { useMemo, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { FormSaveBar } from "@/components/form-save-bar";
import { useDiscardGuard } from "@/components/discard-guard";
import { AdminGate } from "@/components/admin-gate";
import { ClientSections } from "@/components/clients/client-sections";
import { ClientTypeIcon } from "@/components/clients/client-type-icon";
import { useClientForm } from "@/components/clients/use-client-form";
import { useAuth } from "@/app/auth-context";
import { useToast } from "@/app/toast-context";
import { useBack } from "@/lib/use-back";
import {
  CLIENT_EXISTS_STALE_TIME,
  CLIENT_TYPES,
  clientKeys,
  clientsApi,
  useCreateClient,
  type ClientType,
} from "@/features/clients";
import { useZones } from "@/features/zones";
import type { LngLat } from "@/components/map";

const CREATE_FORM_ID = "client-create-form";
const BACK_FALLBACK = "/app/clients";

function parseType(value: string | null): ClientType {
  return CLIENT_TYPES.find((type) => type === value) ?? "GENERIC";
}

function ClientCreateContent() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const goBack = useBack(BACK_FALLBACK);
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const type = parseType(searchParams.get("type"));
  const createClient = useCreateClient();
  const zonesQuery = useZones();
  const zones = useMemo(() => zonesQuery.data ?? [], [zonesQuery.data]);

  const api = useClientForm({
    baseline: null,
    mode: "create",
    idPrefix: "create",
    type,
  });
  const [cipTaken, setCipTaken] = useState<string | null>(null);

  const checkCip = async (): Promise<boolean> => {
    const cip = api.form.cip.trim();
    if (api.form.type !== "PHARMACY" || !cip) return true;
    try {
      const result = await queryClient.fetchQuery({
        queryKey: clientKeys.exists(cip),
        queryFn: () => clientsApi.existsByCip(cip),
        staleTime: CLIENT_EXISTS_STALE_TIME,
      });
      setCipTaken(result.exists ? cip : null);
      return !result.exists;
    } catch {
      return true;
    }
  };
  const guard = useDiscardGuard({ dirty: api.dirty, onLeave: goBack });
  const pending = createClient.isPending;

  const account = user?.account;
  const depot: LngLat | null =
    account?.longitude != null && account?.latitude != null
      ? [account.longitude, account.latitude]
      : null;

  const title = api.form.name.trim() || t("clients.form.createTitle");

  const changeType = (next: ClientType) => {
    api.set("type", next);
    setSearchParams(
      (previous) => {
        const params = new URLSearchParams(previous);
        if (next === "GENERIC") params.delete("type");
        else params.set("type", next);
        return params;
      },
      { replace: true }
    );
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (pending) return;
    if (!api.validate()) return;
    const available = await checkCip();
    if (!available) {
      toast.warning(t("clients.errors.cipAlreadyUsed"));
      return;
    }
    createClient.mutate(api.toInput(), {
      onSuccess: (saved) => {
        toast.success(t("clients.saved"));
        navigate(`/app/clients/${encodeURIComponent(saved.id)}`, {
          replace: true,
        });
      },
      onError: api.applyApiError,
    });
  };

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title={t("clients.form.createTitle")}
        subtitle={t("clients.form.createSubtitle")}
        backFallback={BACK_FALLBACK}
        onBack={guard.requestLeave}
      />

      <form
        id={CREATE_FORM_ID}
        onSubmit={(event) => void handleSubmit(event)}
        noValidate
        className="flex flex-1 flex-col gap-4"
      >
        {cipTaken && (
          <Alert variant="warning">
            <AlertDescription>
              {t("clients.errors.cipAlreadyUsed")}
            </AlertDescription>
          </Alert>
        )}

        {api.formError && (
          <Alert variant="destructive">
            <AlertDescription className="whitespace-pre-line">
              {api.formError}
            </AlertDescription>
          </Alert>
        )}

        <div
          role="radiogroup"
          aria-label={t("clients.form.type")}
          className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:max-w-lg"
        >
          {CLIENT_TYPES.map((option) => {
            const selected = api.form.type === option;
            return (
              <Button
                key={option}
                type="button"
                role="radio"
                aria-checked={selected}
                variant={selected ? "default" : "outline"}
                disabled={pending}
                className="min-h-11 justify-start gap-2"
                onClick={() => changeType(option)}
              >
                <ClientTypeIcon type={option} className="size-4 shrink-0" />
                {t(`clients.types.${option}`)}
              </Button>
            );
          })}
        </div>

        <ClientSections
          mode="create"
          client={null}
          type={api.form.type}
          api={api}
          zones={zones}
          depot={depot}
          depotTitle={account?.societe}
          title={title}
          disabled={pending}
        />

        <FormSaveBar
          dirty={api.dirty}
          pending={pending}
          formId={CREATE_FORM_ID}
          onCancel={guard.requestLeave}
          saveLabel={t("common.create")}
          saveDisabled={false}
        />
      </form>

      {guard.dialog}
    </div>
  );
}

export function ClientCreatePage() {
  return (
    <AdminGate>
      <ClientCreateContent />
    </AdminGate>
  );
}
