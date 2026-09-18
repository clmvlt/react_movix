import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ColorPicker } from "@/components/color-picker";

interface KeyColorInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
}

export function KeyColorInput({
  id,
  value,
  onChange,
}: KeyColorInputProps) {
  const { t } = useTranslation();
  const trimmed = value.trim();

  return (
    <div className="flex min-h-11 items-center gap-2 lg:min-h-10">
      <ColorPicker
        id={id}
        value={trimmed}
        onChange={onChange}
        label={t("clients.fields.color")}
        swatches={false}
        manage={false}
        triggerClassName="size-11 lg:size-8"
      />
      <span className="min-w-0 flex-1 truncate text-sm uppercase text-muted-foreground">
        {trimmed || t("clients.info.noColor")}
      </span>
      {trimmed && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-11 shrink-0 lg:size-8"
          onClick={() => onChange("")}
          aria-label={t("clients.info.clearColor")}
        >
          <X className="size-4" />
        </Button>
      )}
    </div>
  );
}
