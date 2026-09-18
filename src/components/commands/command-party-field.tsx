import { useTranslation } from "react-i18next";
import { Building2, PencilLine } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AddressSearch } from "@/components/address-search";
import { FormField } from "@/components/form-field";
import { ViewSwitch } from "@/components/view-switch";
import { ClientSelectField } from "@/components/clients/client-select-field";
import { addressResultPatch, addressSummary } from "@/lib/address-form";
import type { LngLat } from "@/components/map";
import type { Client } from "@/features/clients";
import {
  emptyPartyFree,
  type PartyFormState,
  type PartyMode,
  type PartyRole,
  type PartyTextField,
} from "./command-create-form";

interface CommandPartyFieldProps {
  role: PartyRole;
  value: PartyFormState;
  onChange: (value: PartyFormState) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  depot?: LngLat | null;
}

export function CommandPartyField({
  role,
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  depot = null,
}: CommandPartyFieldProps) {
  const { t } = useTranslation();
  const idPrefix = `create-command-${role}`;

  const setMode = (mode: PartyMode) => {
    if (mode === value.mode) return;
    onChange({ mode, client: null, free: emptyPartyFree() });
  };

  const setClient = (client: Client | null) =>
    onChange({ ...value, client, free: emptyPartyFree() });

  const setFree = (patch: Partial<PartyFormState["free"]>) =>
    onChange({ ...value, client: null, free: { ...value.free, ...patch } });

  const freeField = (
    field: PartyTextField,
    label: string,
    options?: { required?: boolean; className?: string; type?: string }
  ) => (
    <FormField
      label={label}
      htmlFor={`${idPrefix}-${field}`}
      required={options?.required}
      className={options?.className}
      error={field === "name" ? error : undefined}
    >
      <Input
        id={`${idPrefix}-${field}`}
        type={options?.type}
        value={value.free[field]}
        disabled={disabled}
        autoComplete="off"
        onChange={(event) => setFree({ [field]: event.target.value })}
        className="min-h-11 lg:min-h-10"
      />
    </FormField>
  );

  return (
    <div className="flex flex-col gap-3">
      <ViewSwitch
        size="sm"
        value={value.mode}
        onChange={setMode}
        items={[
          {
            value: "linked",
            label: t("commands.parties.modeLinked"),
            icon: Building2,
          },
          {
            value: "free",
            label: t("commands.parties.modeFree"),
            icon: PencilLine,
          },
        ]}
      />

      {value.mode === "linked" ? (
        <FormField
          label={t("commands.parties.client")}
          htmlFor={`${idPrefix}-client`}
          error={error}
          hint={t("commands.parties.clientHint")}
          required={required}
        >
          <ClientSelectField
            id={`${idPrefix}-client`}
            value={value.client}
            onChange={setClient}
            disabled={disabled}
            invalid={Boolean(error)}
            dialogTitle={t(`commands.parties.pick.${role}`)}
            dialogDescription={t("clients.search.description")}
          />
        </FormField>
      ) : (
        <div className="flex flex-col">
          <FormField
            label={t("clients.info.findAddress")}
            htmlFor={`${idPrefix}-address-search`}
            hint={t("commands.parties.freeHint")}
          >
            <AddressSearch
              id={`${idPrefix}-address-search`}
              onSelect={(result) => setFree(addressResultPatch(result))}
              near={depot}
              defaultTerm={addressSummary({
                address1: value.free.address1,
                postalCode: value.free.postalCode,
                city: value.free.city,
              })}
              ariaLabel={t("clients.info.findAddress")}
              inputClassName="shadow-sm"
              listClassName="max-h-64"
            />
          </FormField>

          {freeField("name", t("clients.fields.name"), { required: true })}

          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            {freeField("firstName", t("clients.fields.firstName"))}
            {freeField("lastName", t("clients.fields.lastName"))}
          </div>

          {freeField("address1", t("clients.fields.address1"))}

          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            {freeField("address2", t("clients.fields.address2"))}
            {freeField("address3", t("clients.fields.address3"))}
          </div>

          <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-x-4">
            {freeField("postalCode", t("clients.fields.postalCode"))}
            {freeField("city", t("clients.fields.city"))}
          </div>

          {freeField("country", t("clients.fields.country"))}

          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            {freeField("phone", t("clients.fields.phone"))}
            {freeField("email", t("clients.fields.email"), { type: "email" })}
          </div>

          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <FormField
              label={t("clients.info.latitude")}
              htmlFor={`${idPrefix}-latitude`}
            >
              <Input
                id={`${idPrefix}-latitude`}
                inputMode="decimal"
                value={value.free.latitude}
                disabled={disabled}
                autoComplete="off"
                onChange={(event) => setFree({ latitude: event.target.value })}
                className="min-h-11 tabular-nums lg:min-h-10"
              />
            </FormField>
            <FormField
              label={t("clients.info.longitude")}
              htmlFor={`${idPrefix}-longitude`}
            >
              <Input
                id={`${idPrefix}-longitude`}
                inputMode="decimal"
                value={value.free.longitude}
                disabled={disabled}
                autoComplete="off"
                onChange={(event) => setFree({ longitude: event.target.value })}
                className="min-h-11 tabular-nums lg:min-h-10"
              />
            </FormField>
          </div>
        </div>
      )}
    </div>
  );
}
