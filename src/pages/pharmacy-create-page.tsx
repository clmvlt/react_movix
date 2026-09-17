import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PageHeader } from "@/components/page-header";
import { FormSaveBar } from "@/components/form-save-bar";
import { useDiscardGuard } from "@/components/discard-guard";
import { PharmacySections } from "@/components/pharmacies/pharmacy-sections";
import { usePharmacyForm } from "@/components/pharmacies/use-pharmacy-form";
import type {
  CipControl,
  CipStatus,
} from "@/components/pharmacies/pharmacy-identity-card";
import { buildCreatePayload } from "@/components/pharmacies/pharmacy-form";
import { useAuth } from "@/app/auth-context";
import { useToast } from "@/app/toast-context";
import { useBack } from "@/lib/use-back";
import {
  PHARMACY_EXISTS_STALE_TIME,
  pharmaciesApi,
  pharmacyKeys,
  useCreatePharmacy,
} from "@/features/pharmacies";
import { useZones } from "@/features/zones";
import type { LngLat } from "@/components/map";

const CREATE_FORM_ID = "pharmacy-create-form";
const BACK_FALLBACK = "/app/pharmacies";

interface CipCheck {
  cip: string;
  exists: boolean;
}

export function PharmacyCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const goBack = useBack(BACK_FALLBACK);
  const toast = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const zonesQuery = useZones();
  const createPharmacy = useCreatePharmacy();
  const api = usePharmacyForm({
    baseline: null,
    mode: "create",
    idPrefix: "create",
  });

  const [checking, setChecking] = useState(false);
  const [checked, setChecked] = useState<CipCheck | null>(null);

  const guard = useDiscardGuard({ dirty: api.dirty, onLeave: goBack });

  const cip = api.form.cip.trim();
  const pending = createPharmacy.isPending;
  const status: CipStatus = checking
    ? "checking"
    : checked && checked.cip === cip
      ? checked.exists
        ? "exists"
        : "available"
      : "idle";

  const checkCip = async (value: string): Promise<boolean | null> => {
    if (!value) {
      setChecked(null);
      return null;
    }
    if (checked && checked.cip === value) return checked.exists;
    setChecking(true);
    try {
      const exists = await queryClient.fetchQuery({
        queryKey: pharmacyKeys.exists(value),
        queryFn: () => pharmaciesApi.exists(value),
        staleTime: PHARMACY_EXISTS_STALE_TIME,
      });
      setChecked({ cip: value, exists });
      return exists;
    } catch {
      setChecked(null);
      return null;
    } finally {
      setChecking(false);
    }
  };

  const cipControl: CipControl = {
    status,
    onBlur: () => void checkCip(cip),
  };

  const submit = async () => {
    if (pending || checking) return;
    if (!api.validate()) return;

    const exists = await checkCip(cip);
    if (exists) {
      toast.warning(t("pharmacies.form.cipExists"));
      api.focusField("cip");
      return;
    }

    createPharmacy.mutate(
      { cip, ...buildCreatePayload(api.form) },
      {
        onSuccess: (saved) => {
          toast.success(t("pharmacies.form.created"));
          navigate(`/app/pharmacies/${encodeURIComponent(saved.cip || cip)}`, {
            replace: true,
          });
        },
        onError: api.applyApiError,
      }
    );
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void submit();
  };

  const account = user?.account;
  const depot: LngLat | null =
    account?.longitude != null && account?.latitude != null
      ? [account.longitude, account.latitude]
      : null;

  const title = api.form.name.trim() || t("pharmacies.form.createTitle");

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title={t("pharmacies.form.createTitle")}
        subtitle={t("pharmacies.form.createDescription")}
        backFallback={BACK_FALLBACK}
        onBack={guard.requestLeave}
      />

      <form
        id={CREATE_FORM_ID}
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-1 flex-col gap-4"
      >
        {api.formError && (
          <Alert variant="destructive">
            <AlertDescription className="whitespace-pre-line">
              {api.formError}
            </AlertDescription>
          </Alert>
        )}

        <PharmacySections
          mode="create"
          pharmacy={api.snapshot}
          api={api}
          zones={zonesQuery.data ?? []}
          depot={depot}
          depotTitle={account?.societe}
          title={title}
          commands={[]}
          disabled={pending || checking}
          cip={cipControl}
        />

        <FormSaveBar
          dirty={api.dirty}
          pending={pending}
          formId={CREATE_FORM_ID}
          onCancel={guard.requestLeave}
          saveDisabled={checking}
          saveLabel={t("common.create")}
          status={api.dirty ? t("pharmacies.form.dirtyStatus") : undefined}
        />
      </form>

      {guard.dialog}
    </div>
  );
}
