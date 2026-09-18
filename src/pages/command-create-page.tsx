import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Info,
  Loader2,
  Package,
  PackageCheck,
  Plus,
  Truck,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PageHeader } from "@/components/page-header";
import { FormField } from "@/components/form-field";
import { DateField } from "@/components/date-field";
import { ClientSelectField } from "@/components/clients/client-select-field";
import { CommandPackageFields } from "@/components/commands/command-package-fields";
import { CommandPartyField } from "@/components/commands/command-party-field";
import { CommandCreatedPanel } from "@/components/commands/command-created-panel";
import {
  buildCreateInput,
  emptyPackage,
  hasErrors,
  initialCreateForm,
  mapServerErrors,
  packageTotals,
  partyErrorField,
  validateCreateForm,
  type CommandCreateFormErrors,
  type CommandCreateFormState,
  type PackageFormState,
  type PartyFormState,
} from "@/components/commands/command-create-form";
import { useAuth } from "@/app/auth-context";
import { useWorkingDate } from "@/app/working-date-context";
import { useToast } from "@/app/toast-context";
import { ApiError, apiErrorText } from "@/lib/api-error";
import type { LngLat } from "@/components/map";
import { useCreateCommand, type CommandCreateResult } from "@/features/commands";
import {
  clientLabel,
  useClient,
  useClientByCip,
  type Client,
} from "@/features/clients";

const FORM_ID = "command-create-form";

function formatTotal(value: number): string {
  return Number(value.toFixed(3)).toString();
}

export function CommandCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { date: workingDate } = useWorkingDate();
  const { user } = useAuth();
  const create = useCreateCommand();

  const initialCip = (searchParams.get("cip") ?? "").trim();
  const initialClientId = (searchParams.get("client") ?? "").trim();

  const [prefilled, setPrefilled] = useState(
    initialCip === "" && initialClientId === ""
  );
  const [form, setForm] = useState<CommandCreateFormState>(() =>
    initialCreateForm(workingDate)
  );
  const [errors, setErrors] = useState<CommandCreateFormErrors>({
    packages: {},
  });
  const [result, setResult] = useState<CommandCreateResult | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  const prefillByCip = useClientByCip(
    prefilled || !initialCip ? undefined : initialCip
  );
  const prefillById = useClient(
    prefilled || !initialClientId ? undefined : initialClientId
  );
  const prefill = initialClientId ? prefillById : prefillByCip;

  useEffect(() => {
    if (result) rootRef.current?.scrollIntoView({ block: "start" });
  }, [result]);

  useEffect(() => {
    if (prefilled) return;
    if (prefill.data) {
      const client = prefill.data;
      setForm((prev) => ({
        ...prev,
        recipient: { ...prev.recipient, mode: "linked", client },
      }));
      setPrefilled(true);
      return;
    }
    if (prefill.isError) setPrefilled(true);
  }, [prefilled, prefill.data, prefill.isError]);

  const totals = useMemo(() => packageTotals(form.packages), [form.packages]);

  const account = user?.account;
  const depot: LngLat | null =
    account?.longitude != null && account?.latitude != null
      ? [account.longitude, account.latitude]
      : null;

  const set = <K extends keyof CommandCreateFormState>(
    key: K,
    value: CommandCreateFormState[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const setParty = (role: "sender" | "recipient", value: PartyFormState) => {
    setForm((prev) => ({ ...prev, [role]: value }));
    setErrors((prev) => ({ ...prev, [role]: undefined }));
  };

  const setOrderer = (client: Client | null) => {
    set("orderer", client);
    setErrors((prev) => ({ ...prev, orderer: undefined }));
  };

  const updatePackage = (key: string, patch: Partial<PackageFormState>) =>
    setForm((prev) => ({
      ...prev,
      packages: prev.packages.map((item) =>
        item.key === key ? { ...item, ...patch } : item
      ),
    }));

  const removePackage = (key: string) =>
    setForm((prev) => ({
      ...prev,
      packages: prev.packages.filter((item) => item.key !== key),
    }));

  const addPackage = () =>
    setForm((prev) => ({ ...prev, packages: [...prev.packages, emptyPackage()] }));

  const handlePartyError = (cause: ApiError): boolean => {
    const code = cause.errorCode;
    if (
      code !== "ORDERER_REQUIRED" &&
      code !== "PARTY_AMBIGUOUS" &&
      code !== "PARTY_INCOMPLETE" &&
      code !== "PARTY_CLIENT_NOT_FOUND"
    ) {
      return false;
    }
    const field = partyErrorField(cause.errorRole) ?? "orderer";
    const message = t(`commands.create.errors.${code}`);
    setErrors((prev) => ({ ...prev, [field]: message }));
    toast.error(message);
    return true;
  };

  const handleError = (cause: unknown) => {
    if (!(cause instanceof ApiError)) {
      toast.error(t("commands.errors.actionFailed"));
      return;
    }

    if (cause.isEmailNotVerified) {
      toast.error(t("commands.create.errors.emailNotVerified"));
      return;
    }

    if (handlePartyError(cause)) return;

    if (cause.status === 404) {
      toast.error(t("commands.create.errors.unknownClient"));
      return;
    }

    if (cause.status === 400) {
      const raw = apiErrorText(cause) ?? "";
      if (
        /^invalid parameter/i.test(raw) ||
        /^format json invalide/i.test(raw)
      ) {
        toast.error(t("commands.create.errors.invalid"));
        return;
      }
      const mapping = mapServerErrors(cause.fieldErrors, form.packages, t);
      if (mapping.matched > 0) {
        setErrors((prev) => ({
          ...mapping.errors,
          packages: { ...prev.packages, ...mapping.errors.packages },
        }));
        toast.error(
          mapping.unmatched.length > 0
            ? mapping.unmatched.join(" - ")
            : t("commands.create.errors.validation")
        );
        return;
      }
      toast.error(raw || t("commands.create.errors.invalid"));
      return;
    }

    if (cause.status === 403) {
      toast.error(t("commands.errors.forbidden"));
      return;
    }

    if (cause.status === 408) {
      toast.error(t("commands.create.errors.timeout"));
      return;
    }

    toast.error(apiErrorText(cause) ?? t("commands.create.errors.server"));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const nextErrors = validateCreateForm(form, t);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) {
      toast.error(t("commands.create.errors.formInvalid"));
      return;
    }

    create.mutate(buildCreateInput(form), {
      onSuccess: setResult,
      onError: handleError,
    });
  };

  const resetForm = () => {
    setForm((prev) => ({
      ...initialCreateForm(prev.expDate),
      orderer: prev.orderer,
      sender: prev.sender,
      recipient: prev.recipient,
    }));
    setErrors({ packages: {} });
    setResult(null);
  };

  const recipientLabel =
    form.recipient.mode === "linked"
      ? (form.recipient.client
          ? clientLabel(form.recipient.client)
          : t("clients.untitled"))
      : (form.recipient.free.name.trim() || t("clients.untitled"));

  const prefillPending = !prefilled && prefill.isLoading;
  const busy = create.isPending;

  if (result) {
    return (
      <div ref={rootRef} className="flex w-full flex-1 flex-col">
        <PageHeader
          title={t("commands.create.success.title")}
          subtitle={recipientLabel}
          backFallback="/app/commands"
        />
        <CommandCreatedPanel
          result={result}
          pharmacyName={recipientLabel}
          onOpenCommand={() => navigate(`/app/commands/${result.id_command}`)}
          onCreateAnother={resetForm}
        />
      </div>
    );
  }

  return (
    <div ref={rootRef} className="flex w-full flex-1 flex-col">
      <PageHeader
        title={t("commands.create.title")}
        subtitle={t("commands.create.subtitle")}
        backFallback="/app/commands"
      />

      <form
        id={FORM_ID}
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col gap-4 pb-24 lg:pb-0"
      >
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">
                {t("commands.create.sectionOrder")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                <FormField
                  label={t("commands.parties.orderer")}
                  htmlFor="create-command-orderer"
                  error={errors.orderer}
                  hint={t("commands.parties.ordererHint")}
                  className="sm:col-span-2"
                  required
                >
                  <ClientSelectField
                    id="create-command-orderer"
                    value={form.orderer}
                    onChange={setOrderer}
                    disabled={busy}
                    invalid={Boolean(errors.orderer)}
                    dialogTitle={t("commands.parties.pick.orderer")}
                    dialogDescription={t("clients.search.description")}
                  />
                </FormField>

                <FormField
                  label={t("commands.expDate")}
                  htmlFor="create-command-exp-date"
                  error={errors.expDate}
                  required
                >
                  <DateField
                    id="create-command-exp-date"
                    value={form.expDate}
                    onChange={(value) => set("expDate", value)}
                    disabled={busy}
                    className="min-h-11 lg:min-h-10"
                  />
                </FormField>

                <FormField
                  label={t("commands.create.expTime")}
                  htmlFor="create-command-exp-time"
                  error={errors.expTime}
                  hint={t("commands.create.expTimeHint")}
                >
                  <Input
                    id="create-command-exp-time"
                    type="time"
                    value={form.expTime}
                    disabled={busy}
                    onChange={(event) => set("expTime", event.target.value)}
                    className="min-h-11 lg:min-h-10"
                  />
                </FormField>

                <FormField
                  label={t("commands.create.numTransport")}
                  htmlFor="create-command-num-transport"
                  error={errors.numTransport}
                  hint={t("commands.create.numTransportHint")}
                  className="sm:col-span-2"
                  required
                >
                  <Input
                    id="create-command-num-transport"
                    value={form.numTransport}
                    disabled={busy}
                    autoComplete="off"
                    onChange={(event) =>
                      set("numTransport", event.target.value)
                    }
                    className="min-h-11 lg:min-h-10"
                  />
                </FormField>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t("commands.create.totals")}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-xs text-muted-foreground">
                    {t("commands.packages")}
                  </dt>
                  <dd className="text-lg font-semibold tabular-nums text-foreground">
                    {totals.count}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">
                    {t("commands.create.packageQuantity")}
                  </dt>
                  <dd className="text-lg font-semibold tabular-nums text-foreground">
                    {formatTotal(totals.quantity)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">
                    {t("commands.create.totalWeight")}
                  </dt>
                  <dd className="text-lg font-semibold tabular-nums text-foreground">
                    {formatTotal(totals.weight)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">
                    {t("commands.create.totalVolume")}
                  </dt>
                  <dd className="text-lg font-semibold tabular-nums text-foreground">
                    {formatTotal(totals.volume)}
                  </dd>
                </div>
              </dl>
              <Alert>
                <Info />
                <AlertDescription>
                  {t("commands.create.totalsHint")}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Truck
                  aria-hidden
                  className="size-4 shrink-0 text-muted-foreground"
                />
                {t("commands.parties.sender")}
                <span className="text-sm font-normal text-muted-foreground">
                  {t("commands.parties.senderOptional")}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CommandPartyField
                role="sender"
                value={form.sender}
                onChange={(value) => setParty("sender", value)}
                error={errors.sender}
                disabled={busy}
                depot={depot}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <PackageCheck
                  aria-hidden
                  className="size-4 shrink-0 text-muted-foreground"
                />
                {t("commands.parties.recipient")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CommandPartyField
                role="recipient"
                value={form.recipient}
                onChange={(value) => setParty("recipient", value)}
                error={errors.recipient}
                disabled={busy || prefillPending}
                required
                depot={depot}
              />
            </CardContent>
          </Card>
        </div>

        <section className="flex flex-1 flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <Package className="size-5 shrink-0 text-muted-foreground" />
              {t("commands.create.sectionPackages")}
              <span className="text-sm font-normal tabular-nums text-muted-foreground">
                {form.packages.length}
              </span>
            </h2>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 lg:min-h-10"
              disabled={busy}
              onClick={addPackage}
            >
              <Plus />
              {t("commands.create.addPackage")}
            </Button>
          </div>

          {form.packages.length === 0 ? (
            <div className="flex flex-col gap-3">
              <Alert variant="warning">
                <TriangleAlert />
                <div>
                  <AlertTitle>
                    {t("commands.create.noPackagesTitle")}
                  </AlertTitle>
                  <AlertDescription>
                    {t("commands.create.noPackagesDescription")}
                  </AlertDescription>
                </div>
              </Alert>
              <div className="flex items-center gap-3">
                <Checkbox
                  id="create-command-allow-empty"
                  checked={form.allowNoPackages}
                  disabled={busy}
                  onCheckedChange={(checked) => {
                    set("allowNoPackages", checked === true);
                    setErrors((prev) => ({ ...prev, global: undefined }));
                  }}
                  className="size-5"
                />
                <Label
                  htmlFor="create-command-allow-empty"
                  className="font-normal"
                >
                  {t("commands.create.allowNoPackages")}
                </Label>
              </div>
              {errors.global && (
                <p className="text-xs leading-4 text-destructive">
                  {errors.global}
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {form.packages.map((item, index) => (
                <CommandPackageFields
                  key={item.key}
                  index={index}
                  value={item}
                  errors={errors.packages[item.key] ?? {}}
                  disabled={busy}
                  onChange={(patch) => updatePackage(item.key, patch)}
                  onRemove={() => removePackage(item.key)}
                />
              ))}
            </div>
          )}
        </section>

        <div className="hidden justify-end gap-2 lg:flex">
          <Button
            type="button"
            variant="outline"
            className="min-h-10"
            disabled={busy}
            onClick={() => navigate("/app/commands")}
          >
            {t("common.cancel")}
          </Button>
          <Button type="submit" className="min-h-10" disabled={busy}>
            {busy && <Loader2 className="animate-spin" />}
            {t("commands.create.submit")}
          </Button>
        </div>
      </form>

      <div className="fixed inset-x-0 bottom-0 z-30 flex gap-2 border-t bg-card/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-lg backdrop-blur lg:hidden">
        <Button
          type="submit"
          form={FORM_ID}
          className="min-h-11 flex-1"
          disabled={busy}
        >
          {busy && <Loader2 className="animate-spin" />}
          {t("commands.create.submit")}
        </Button>
      </div>
    </div>
  );
}
