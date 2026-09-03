import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Info, Loader2, Package, Plus, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PageHeader } from "@/components/page-header";
import { FormField } from "@/components/form-field";
import { DateField } from "@/components/date-field";
import { PharmacyPicker } from "@/components/pharmacies/pharmacy-picker";
import { CommandPackageFields } from "@/components/commands/command-package-fields";
import { CommandCreatedPanel } from "@/components/commands/command-created-panel";
import {
  buildCreateInput,
  emptyPackage,
  hasErrors,
  initialCreateForm,
  mapServerErrors,
  packageTotals,
  validateCreateForm,
  type CommandCreateFormErrors,
  type CommandCreateFormState,
  type PackageFormState,
} from "@/components/commands/command-create-form";
import { useWorkingDate } from "@/app/working-date-context";
import { useToast } from "@/app/toast-context";
import { ApiError, apiErrorText } from "@/lib/api-error";
import { useCreateCommand, type CommandCreateResult } from "@/features/commands";
import { usePharmacy, type Pharmacy } from "@/features/pharmacies";

const FORM_ID = "command-create-form";

function formatTotal(value: number): string {
  return Number(value.toFixed(3)).toString();
}

export function CommandCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { date: workingDate } = useWorkingDate();
  const create = useCreateCommand();

  const initialCip = (searchParams.get("cip") ?? "").trim();

  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [prefilled, setPrefilled] = useState(initialCip === "");
  const [form, setForm] = useState<CommandCreateFormState>(() =>
    initialCreateForm(workingDate)
  );
  const [errors, setErrors] = useState<CommandCreateFormErrors>({
    packages: {},
  });
  const [result, setResult] = useState<CommandCreateResult | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  const prefill = usePharmacy(prefilled ? undefined : initialCip);

  useEffect(() => {
    if (result) rootRef.current?.scrollIntoView({ block: "start" });
  }, [result]);

  useEffect(() => {
    if (prefilled) return;
    if (prefill.data) {
      setPharmacy(prefill.data);
      setPrefilled(true);
      return;
    }
    if (prefill.isError) setPrefilled(true);
  }, [prefilled, prefill.data, prefill.isError]);

  const totals = useMemo(() => packageTotals(form.packages), [form.packages]);

  const set = <K extends keyof CommandCreateFormState>(
    key: K,
    value: CommandCreateFormState[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }));

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

  const handleError = (cause: unknown) => {
    if (!(cause instanceof ApiError)) {
      toast.error(t("commands.errors.actionFailed"));
      return;
    }

    if (cause.isEmailNotVerified) {
      toast.error(t("commands.create.errors.emailNotVerified"));
      return;
    }

    if (cause.status === 404) {
      toast.error(t("commands.create.errors.unknownCip"));
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

    const cip = pharmacy?.cip ?? "";
    const nextErrors = validateCreateForm(form, cip, t);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) {
      toast.error(t("commands.create.errors.formInvalid"));
      return;
    }

    create.mutate(buildCreateInput(form, cip), {
      onSuccess: setResult,
      onError: handleError,
    });
  };

  const resetForm = () => {
    setForm(initialCreateForm(form.expDate));
    setErrors({ packages: {} });
    setResult(null);
  };

  const pharmacyLabel =
    pharmacy?.name?.trim() || pharmacy?.cip || t("pharmacies.untitled");

  if (result) {
    return (
      <div ref={rootRef} className="flex w-full flex-1 flex-col">
        <PageHeader
          title={t("commands.create.success.title")}
          subtitle={pharmacyLabel}
          backFallback="/app/commands"
        />
        <CommandCreatedPanel
          result={result}
          pharmacyName={pharmacyLabel}
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
                  label={t("commands.pharmacy")}
                  htmlFor="create-command-pharmacy"
                  error={errors.cip}
                  hint={t("commands.create.pharmacyHint")}
                  className="sm:col-span-2"
                  required
                >
                  <PharmacyPicker
                    id="create-command-pharmacy"
                    value={pharmacy?.cip ?? ""}
                    selected={pharmacy}
                    onSelect={setPharmacy}
                    disabled={create.isPending}
                    loading={!prefilled && prefill.isLoading}
                    invalid={Boolean(errors.cip)}
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
                    disabled={create.isPending}
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
                    disabled={create.isPending}
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
                    disabled={create.isPending}
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
              disabled={create.isPending}
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
                  disabled={create.isPending}
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
                  disabled={create.isPending}
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
            disabled={create.isPending}
            onClick={() => navigate("/app/commands")}
          >
            {t("common.cancel")}
          </Button>
          <Button type="submit" className="min-h-10" disabled={create.isPending}>
            {create.isPending && <Loader2 className="animate-spin" />}
            {t("commands.create.submit")}
          </Button>
        </div>
      </form>

      <div className="fixed inset-x-0 bottom-0 z-30 flex gap-2 border-t bg-card/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-lg backdrop-blur lg:hidden">
        <Button
          type="submit"
          form={FORM_ID}
          className="min-h-11 flex-1"
          disabled={create.isPending}
        >
          {create.isPending && <Loader2 className="animate-spin" />}
          {t("commands.create.submit")}
        </Button>
      </div>
    </div>
  );
}
