import { useTranslation } from "react-i18next";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FormField } from "@/components/form-field";
import type {
  PackageErrors,
  PackageFormState,
} from "@/components/commands/command-create-form";

interface CommandPackageFieldsProps {
  index: number;
  value: PackageFormState;
  errors: PackageErrors;
  disabled?: boolean;
  onChange: (patch: Partial<PackageFormState>) => void;
  onRemove: () => void;
}

export function CommandPackageFields({
  index,
  value,
  errors,
  disabled = false,
  onChange,
  onRemove,
}: CommandPackageFieldsProps) {
  const { t } = useTranslation();
  const prefix = `package-${value.key}`;

  const numberField = (
    field: "quantity" | "weight" | "volume" | "length" | "width" | "height",
    label: string,
    hint?: string
  ) => (
    <FormField
      label={label}
      htmlFor={`${prefix}-${field}`}
      error={errors[field]}
      hint={hint}
    >
      <Input
        id={`${prefix}-${field}`}
        value={value[field]}
        disabled={disabled}
        inputMode="decimal"
        autoComplete="off"
        onChange={(event) => onChange({ [field]: event.target.value })}
        className="min-h-11 tabular-nums lg:min-h-10"
      />
    </FormField>
  );

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">
          {t("commands.create.packageIndex", { index: index + 1 })}
        </h3>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-11 shrink-0 text-muted-foreground hover:text-destructive lg:size-9"
          disabled={disabled}
          onClick={onRemove}
          title={t("commands.create.removePackage")}
          aria-label={t("commands.create.removePackage")}
        >
          <Trash2 />
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2 xl:grid-cols-3">
        <FormField
          label={t("commands.detail.designation")}
          htmlFor={`${prefix}-designation`}
          className="sm:col-span-2 xl:col-span-1"
        >
          <Input
            id={`${prefix}-designation`}
            value={value.designation}
            disabled={disabled}
            autoComplete="off"
            onChange={(event) => onChange({ designation: event.target.value })}
            className="min-h-11 lg:min-h-10"
          />
        </FormField>

        <FormField
          label={t("commands.create.packageType")}
          htmlFor={`${prefix}-type`}
          hint={t("commands.create.packageTypeHint")}
        >
          <Input
            id={`${prefix}-type`}
            value={value.type}
            disabled={disabled}
            autoComplete="off"
            onChange={(event) => onChange({ type: event.target.value })}
            className="min-h-11 lg:min-h-10"
          />
        </FormField>

        <FormField
          label={t("commands.create.packageNum")}
          htmlFor={`${prefix}-num`}
        >
          <Input
            id={`${prefix}-num`}
            value={value.num}
            disabled={disabled}
            autoComplete="off"
            onChange={(event) => onChange({ num: event.target.value })}
            className="min-h-11 lg:min-h-10"
          />
        </FormField>

        {numberField("quantity", t("commands.create.packageQuantity"))}
        {numberField("weight", t("commands.create.packageWeight"))}
        {numberField("volume", t("commands.create.packageVolume"))}
        {numberField("length", t("commands.create.packageLength"))}
        {numberField("width", t("commands.create.packageWidth"))}
        {numberField("height", t("commands.create.packageHeight"))}

        <FormField
          label={t("commands.create.packageId")}
          htmlFor={`${prefix}-id`}
          error={errors.id}
          hint={t("commands.create.packageIdHint")}
          className="sm:col-span-2 xl:col-span-3"
        >
          <Input
            id={`${prefix}-id`}
            value={value.id}
            disabled={disabled}
            autoComplete="off"
            inputMode="numeric"
            onChange={(event) => onChange({ id: event.target.value })}
            className="min-h-11 tabular-nums lg:min-h-10"
          />
        </FormField>
      </div>

      <div className="flex items-center gap-3">
        <Checkbox
          id={`${prefix}-fresh`}
          checked={value.fresh}
          disabled={disabled}
          onCheckedChange={(checked) => onChange({ fresh: checked === true })}
          className="size-5"
        />
        <Label htmlFor={`${prefix}-fresh`} className="font-normal">
          {t("commands.create.packageFresh")}
        </Label>
      </div>
    </div>
  );
}
