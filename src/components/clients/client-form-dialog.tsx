import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronRight, Loader2, TriangleAlert } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { FormField } from "@/components/form-field";
import {
  DeliveryWindowFields,
  type DeliveryWindowForm,
} from "@/components/delivery-window-fields";
import { KeyColorInput } from "@/components/key-color-input";
import { ZoneSelect } from "@/components/zone-select";
import { useInvoiceError } from "@/components/invoices/use-invoice-error";
import { useToast } from "@/app/toast-context";
import { ApiError } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import { useZones } from "@/features/zones";
import {
  CLIENT_NAME_MAX,
  CLIENT_TEXT_MAX,
  CLIENT_TYPES,
  useCreateClient,
  useUpdateClient,
  type Client,
  type ClientBillingAddressField,
  type ClientType,
} from "@/features/clients";
import { ClientTypeIcon } from "./client-type-icon";
import {
  buildClientInput,
  hasBillingAddress,
  initialClientForm,
  validateClientForm,
  type ClientFormState,
  type ClientTextField,
} from "./client-form";

const EMITTING_FIELDS: ClientTextField[] = [
  "name",
  "address1",
  "postalCode",
  "city",
];

interface ClientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
  initialName?: string;
  initialType?: ClientType;
  notice?: string;
  onSaved?: (client: Client) => void;
}

function Section({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("flex flex-col gap-1", className)}>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </section>
  );
}

export function ClientFormDialog({
  open,
  onOpenChange,
  client,
  initialName,
  initialType = "GENERIC",
  notice,
  onSaved,
}: ClientFormDialogProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const describeError = useInvoiceError();
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const zonesQuery = useZones();

  const [form, setForm] = useState<ClientFormState>(() =>
    initialClientForm(client, initialType)
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [billingOpen, setBillingOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const next = initialClientForm(client, initialType);
    if (!client && initialName) next.name = initialName;
    setForm(next);
    setErrors({});
    setBillingOpen(hasBillingAddress(next.billingAddress));
  }, [open, client, initialName, initialType]);

  const pending = createClient.isPending || updateClient.isPending;
  const zones = useMemo(() => zonesQuery.data ?? [], [zonesQuery.data]);

  const missing = new Set(
    (client?.missingFields ?? []).filter(
      (field) => !form[field as ClientTextField]?.toString().trim()
    )
  );

  const set = <K extends keyof ClientFormState>(
    field: K,
    value: ClientFormState[K]
  ) => {
    setForm((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field as string]: "" }));
  };

  const setWindow = <K extends keyof DeliveryWindowForm>(
    key: K,
    value: DeliveryWindowForm[K]
  ) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: "" }));
  };

  const setBilling = (field: ClientBillingAddressField, value: string) => {
    setForm((previous) => ({
      ...previous,
      billingAddress: { ...previous.billingAddress, [field]: value },
    }));
    setErrors((previous) => ({ ...previous, [`billingAddress.${field}`]: "" }));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const invalid = validateClientForm(form, t);
    if (Object.keys(invalid).length > 0) {
      setErrors(invalid);
      if (Object.keys(invalid).some((key) => key.startsWith("billingAddress"))) {
        setBillingOpen(true);
      }
      return;
    }

    const input = buildClientInput(form);
    const options = {
      onSuccess: (saved: Client) => {
        toast.success(t("clients.saved"));
        onOpenChange(false);
        onSaved?.(saved);
      },
      onError: (error: unknown) => {
        if (error instanceof ApiError) {
          const fieldErrors = error.structuredFieldErrors;
          if (Object.keys(fieldErrors).length > 0) {
            setErrors(fieldErrors);
            if (
              Object.keys(fieldErrors).some((key) =>
                key.startsWith("billingAddress")
              )
            ) {
              setBillingOpen(true);
            }
          }
        }
        toast.error(describeError(error, "clients.errors.saveFailed"));
      },
    };

    if (client) {
      updateClient.mutate({ id: client.id, input }, options);
    } else {
      createClient.mutate(input, options);
    }
  };

  const field = (
    name: ClientTextField,
    options: {
      className?: string;
      type?: string;
      autoComplete?: string;
      inputMode?: "numeric" | "email" | "tel";
      placeholder?: string;
      maxLength?: number;
      required?: boolean;
    } = {}
  ) => {
    const id = `client-${name}`;
    const highlighted = missing.has(name);
    return (
      <FormField
        label={t(`clients.fields.${name}`)}
        htmlFor={id}
        error={errors[name]}
        hint={
          highlighted
            ? t("clients.missingHint")
            : EMITTING_FIELDS.includes(name)
              ? t("clients.emittingHint")
              : undefined
        }
        required={options.required}
        className={options.className}
      >
        <Input
          id={id}
          value={form[name]}
          onChange={(event) => set(name, event.target.value)}
          disabled={pending}
          type={options.type}
          inputMode={options.inputMode}
          autoComplete={options.autoComplete ?? "off"}
          placeholder={options.placeholder}
          maxLength={options.maxLength}
          aria-invalid={errors[name] || highlighted ? true : undefined}
          aria-describedby={`${id}-message`}
          className={cn(
            "min-h-11 lg:min-h-10",
            highlighted &&
              "border-status-warning-strong ring-1 ring-status-warning-strong/40"
          )}
        />
      </FormField>
    );
  };

  const billingField = (
    name: ClientBillingAddressField,
    options: { className?: string; type?: string; autoComplete?: string } = {}
  ) => {
    const id = `client-billing-${name}`;
    const key = `billingAddress.${name}`;
    return (
      <FormField
        label={t(`clients.fields.${name}`)}
        htmlFor={id}
        error={errors[key]}
        className={options.className}
      >
        <Input
          id={id}
          value={form.billingAddress[name]}
          onChange={(event) => setBilling(name, event.target.value)}
          disabled={pending}
          type={options.type}
          autoComplete={options.autoComplete ?? "off"}
          aria-invalid={errors[key] ? true : undefined}
          aria-describedby={`${id}-message`}
          className="min-h-11 lg:min-h-10"
        />
      </FormField>
    );
  };

  const textArea = (name: "informations" | "commentaire") => {
    const id = `client-${name}`;
    return (
      <FormField
        label={t(`clients.fields.${name}`)}
        htmlFor={id}
        error={errors[name]}
        className="sm:col-span-2"
      >
        <Textarea
          id={id}
          rows={2}
          value={form[name]}
          maxLength={CLIENT_TEXT_MAX}
          onChange={(event) => set(name, event.target.value)}
          disabled={pending}
          aria-invalid={errors[name] ? true : undefined}
          aria-describedby={`${id}-message`}
        />
      </FormField>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {client ? t("clients.form.editTitle") : t("clients.form.createTitle")}
          </DialogTitle>
          <DialogDescription>{t("clients.form.subtitle")}</DialogDescription>
        </DialogHeader>

        {(notice || missing.size > 0) && (
          <Alert variant="warning">
            <TriangleAlert />
            <AlertTitle>{notice ?? t("clients.missingTitle")}</AlertTitle>
            {missing.size > 0 && (
              <AlertDescription>
                {[...missing]
                  .map((name) =>
                    t(`clients.fields.${name}`, { defaultValue: name })
                  )
                  .join(", ")}
              </AlertDescription>
            )}
          </Alert>
        )}

        <form
          id="client-form"
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-4"
        >
          <Section title={t("clients.form.type")}>
            {client ? (
              <p className="flex min-h-10 items-center gap-2 text-sm text-muted-foreground">
                {t(`clients.types.${client.type}`)}
                <span className="text-xs">{t("clients.form.typeLocked")}</span>
              </p>
            ) : (
              <div
                role="radiogroup"
                aria-label={t("clients.form.type")}
                className="grid grid-cols-1 gap-2 sm:grid-cols-2"
              >
                {CLIENT_TYPES.map((type) => {
                  const selected = form.type === type;
                  return (
                    <Button
                      key={type}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      variant={selected ? "default" : "outline"}
                      disabled={pending}
                      className="min-h-11 justify-start gap-2"
                      onClick={() => set("type", type)}
                    >
                      <ClientTypeIcon type={type} className="size-4 shrink-0" />
                      {t(`clients.types.${type}`)}
                    </Button>
                  );
                })}
              </div>
            )}
          </Section>

          <Section title={t("clients.form.identity")}>
            <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
              {field("name", {
                className: "sm:col-span-2",
                autoComplete: "organization",
                maxLength: CLIENT_NAME_MAX,
                required: form.type === "GENERIC",
              })}
              {field("firstName", { autoComplete: "given-name" })}
              {field("lastName", { autoComplete: "family-name" })}
              {field("quality")}
              {field("siret", { inputMode: "numeric" })}
              {field("vatNumber")}
            </div>
          </Section>

          {form.type === "PHARMACY" && (
            <Section title={t("clients.form.pharmacy")}>
              <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                {field("cip", { required: true })}
                {field("numero")}
                <FormField
                  label={t("clients.fields.color")}
                  htmlFor="client-color"
                  error={errors.color}
                >
                  <KeyColorInput
                    id="client-color"
                    value={form.color}
                    onChange={(value) => set("color", value)}
                  />
                </FormField>
                <div className="flex flex-col gap-2 py-1.5">
                  {(
                    [
                      "doubleCleTransporteur",
                      "doubleCleExpediteur",
                    ] as const
                  ).map((key) => (
                    <Label
                      key={key}
                      htmlFor={`client-${key}`}
                      className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-lg border border-border px-3 lg:min-h-10"
                    >
                      <span className="text-sm font-normal">
                        {t(`clients.fields.${key}`)}
                      </span>
                      <Switch
                        id={`client-${key}`}
                        checked={form[key]}
                        disabled={pending}
                        onCheckedChange={(checked) => set(key, checked)}
                      />
                    </Label>
                  ))}
                </div>
              </div>
            </Section>
          )}

          <Section title={t("clients.form.address")}>
            <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
              {field("address1", {
                className: "sm:col-span-2",
                autoComplete: "address-line1",
              })}
              {field("address2", { autoComplete: "address-line2" })}
              {field("address3", { autoComplete: "address-line3" })}
              {field("postalCode", {
                inputMode: "numeric",
                autoComplete: "postal-code",
              })}
              {field("city", { autoComplete: "address-level2" })}
              {field("country", {
                autoComplete: "country-name",
                placeholder: t("clients.countryPlaceholder"),
              })}
            </div>
          </Section>

          <Section title={t("clients.form.contact")}>
            <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
              {field("phone", { type: "tel", inputMode: "tel" })}
              {field("fax", { type: "tel", inputMode: "tel" })}
              {field("email", {
                className: "sm:col-span-2",
                type: "email",
                inputMode: "email",
              })}
            </div>
          </Section>

          <Section title={t("clients.form.delivery")}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="client-zone">{t("clients.fields.zone")}</Label>
                <ZoneSelect
                  id="client-zone"
                  value={form.zoneId}
                  onChange={(value) => set("zoneId", value)}
                  zones={zones}
                  neutralLabel={t("clients.noZone")}
                  ariaLabel={t("clients.fields.zone")}
                  disabled={pending || zonesQuery.isLoading}
                  className="min-h-11 lg:min-h-10"
                />
              </div>
              <DeliveryWindowFields
                idPrefix="client"
                form={form}
                errors={errors}
                onChange={setWindow}
              />
            </div>
          </Section>

          <Section title={t("clients.form.notes")}>
            <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
              {textArea("informations")}
              {textArea("commentaire")}
            </div>
          </Section>

          <section className="rounded-lg border border-border">
            <button
              type="button"
              onClick={() => setBillingOpen((previous) => !previous)}
              aria-expanded={billingOpen}
              aria-controls="client-billing-address"
              className="flex min-h-12 w-full items-center gap-2 px-3 text-left text-sm font-semibold"
            >
              {billingOpen ? (
                <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              )}
              <span className="min-w-0 flex-1">
                {t("clients.form.billingAddress")}
              </span>
              {hasBillingAddress(form.billingAddress) && (
                <span className="shrink-0 text-xs font-normal text-muted-foreground">
                  {t("clients.form.billingAddressFilled")}
                </span>
              )}
            </button>
            {billingOpen && (
              <div
                id="client-billing-address"
                className="border-t border-border px-3 pb-1 pt-3"
              >
                <p className="mb-2 text-xs text-muted-foreground">
                  {t("clients.form.billingAddressHint")}
                </p>
                <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                  {billingField("name", {
                    className: "sm:col-span-2",
                    autoComplete: "organization",
                  })}
                  {billingField("address1", {
                    className: "sm:col-span-2",
                    autoComplete: "address-line1",
                  })}
                  {billingField("address2", {
                    className: "sm:col-span-2",
                    autoComplete: "address-line2",
                  })}
                  {billingField("postalCode", { autoComplete: "postal-code" })}
                  {billingField("city", { autoComplete: "address-level2" })}
                  {billingField("country", { autoComplete: "country-name" })}
                  {billingField("email", { type: "email" })}
                </div>
              </div>
            )}
          </section>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="min-h-11 sm:min-h-10"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            form="client-form"
            className="min-h-11 sm:min-h-10"
            disabled={pending}
          >
            {pending && <Loader2 className="size-4 animate-spin" />}
            {client ? t("common.save") : t("common.create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
