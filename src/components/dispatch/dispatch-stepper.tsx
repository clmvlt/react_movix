import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DispatchStepperProps {
  id: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  decreaseLabel: string;
  increaseLabel: string;
  unit?: string;
}

export function DispatchStepper({
  id,
  value,
  min,
  max,
  onChange,
  decreaseLabel,
  increaseLabel,
  unit,
}: DispatchStepperProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const clamp = (next: number) => Math.min(max, Math.max(min, next));

  const step = (delta: number) => {
    setDraft(null);
    onChange(clamp(value + delta));
  };

  const type = (text: string) => {
    const digits = text.replace(/\D/g, "").slice(0, 3);
    setDraft(digits);
    if (digits !== "") onChange(clamp(Number(digits)));
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-11 shrink-0 lg:size-10"
        disabled={value <= min}
        aria-label={decreaseLabel}
        onClick={() => step(-1)}
      >
        <Minus />
      </Button>
      <Input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={draft ?? String(value)}
        onChange={(event) => type(event.target.value)}
        onBlur={() => setDraft(null)}
        className="h-11 w-14 shrink-0 px-2 text-center tabular-nums lg:h-10"
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-11 shrink-0 lg:size-10"
        disabled={value >= max}
        aria-label={increaseLabel}
        onClick={() => step(1)}
      >
        <Plus />
      </Button>
      {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
    </div>
  );
}
