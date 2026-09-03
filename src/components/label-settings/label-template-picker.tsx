import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Check, Loader2 } from "lucide-react";
import { useObjectUrl } from "@/lib/use-object-url";
import { cn } from "@/lib/utils";
import {
  LABEL_TEMPLATES,
  useLabelPreview,
  type LabelConfigPayload,
  type LabelTemplate,
} from "@/features/label-settings";

interface LabelTemplatePickerProps {
  value: LabelTemplate;
  previewConfig: LabelConfigPayload | null;
  disabled: boolean;
  onChange: (template: LabelTemplate) => void;
}

interface LabelTemplateOptionProps extends LabelTemplatePickerProps {
  template: LabelTemplate;
}

function templateKey(template: LabelTemplate): string {
  return template === "CLASSIC" ? "classic" : "modern";
}

function LabelTemplateOption({
  template,
  value,
  previewConfig,
  disabled,
  onChange,
}: LabelTemplateOptionProps) {
  const { t } = useTranslation();
  const selected = value === template;
  const name = t(`labelSettings.template.${templateKey(template)}`);

  const variant = useMemo(
    () => (previewConfig ? { ...previewConfig, template } : null),
    [previewConfig, template]
  );
  const previewQuery = useLabelPreview(variant);
  const url = useObjectUrl(previewQuery.data ?? null);

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={() => onChange(template)}
      className={cn(
        "flex flex-col items-center gap-2 rounded-lg border-2 p-2 text-center transition-colors",
        selected
          ? "border-primary bg-primary/5"
          : "border-border hover:bg-accent",
        disabled && "cursor-not-allowed opacity-70"
      )}
    >
      <span className="relative flex w-full items-center justify-center rounded-md bg-muted p-2">
        {url ? (
          <img
            src={url}
            alt={t("labelSettings.template.alt", { template: name })}
            className={cn(
              "max-h-40 max-w-full object-contain transition-opacity",
              previewQuery.isFetching && "opacity-50"
            )}
          />
        ) : (
          <span
            aria-hidden
            className={cn(
              "rounded-sm bg-background",
              previewConfig?.orientation === "LANDSCAPE"
                ? "h-28 w-40 max-w-full"
                : "h-40 w-28"
            )}
          />
        )}
        {previewQuery.isFetching && (
          <span className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </span>
        )}
      </span>
      <span className="flex items-center gap-1.5 text-sm font-medium">
        {selected && <Check className="size-4 shrink-0 text-primary" />}
        {name}
      </span>
      <span className="text-xs leading-4 text-muted-foreground">
        {t(`labelSettings.template.${templateKey(template)}Hint`)}
      </span>
    </button>
  );
}

export function LabelTemplatePicker(props: LabelTemplatePickerProps) {
  const { t } = useTranslation();

  return (
    <div
      role="radiogroup"
      aria-label={t("labelSettings.template.title")}
      className="grid grid-cols-2 gap-3 sm:gap-4"
    >
      {LABEL_TEMPLATES.map((template) => (
        <LabelTemplateOption key={template} template={template} {...props} />
      ))}
    </div>
  );
}
