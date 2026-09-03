import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface LabelFontSizeControlProps {
  id: string;
  value: number;
  min: number | null;
  max: number | null;
  label: string;
  disabled: boolean;
  onChange: (value: number) => void;
}

export function LabelFontSizeControl({
  id,
  value,
  min,
  max,
  label,
  disabled,
  onChange,
}: LabelFontSizeControlProps) {
  const { t } = useTranslation();
  const [text, setText] = useState(String(value));

  useEffect(() => {
    setText(String(value));
  }, [value]);

  const clamp = (input: number) => {
    let next = input;
    if (min !== null) next = Math.max(min, next);
    if (max !== null) next = Math.min(max, next);
    return next;
  };

  const step = (delta: number) => {
    const next = clamp(value + delta);
    setText(String(next));
    if (next !== value) onChange(next);
  };

  const handleChange = (raw: string) => {
    setText(raw);
    const parsed = Number(raw);
    if (!raw.trim() || !Number.isInteger(parsed)) return;
    if (parsed !== value) onChange(parsed);
  };

  const handleBlur = () => {
    const parsed = Number(text);
    const next =
      text.trim() && Number.isFinite(parsed) ? clamp(Math.round(parsed)) : value;
    setText(String(next));
    if (next !== value) onChange(next);
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-11 shrink-0 lg:size-9"
        aria-label={t("labelSettings.fields.decrease", { field: label })}
        disabled={disabled || (min !== null && value <= min)}
        onClick={() => step(-1)}
      >
        <Minus />
      </Button>
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        value={text}
        min={min ?? undefined}
        max={max ?? undefined}
        aria-label={t("labelSettings.fields.fontSizeFor", { field: label })}
        disabled={disabled}
        onChange={(event) => handleChange(event.target.value)}
        onBlur={handleBlur}
        className="h-11 w-16 shrink-0 px-2 text-center tabular-nums lg:h-9"
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-11 shrink-0 lg:size-9"
        aria-label={t("labelSettings.fields.increase", { field: label })}
        disabled={disabled || (max !== null && value >= max)}
        onClick={() => step(1)}
      >
        <Plus />
      </Button>
    </div>
  );
}
