import { useTranslation } from "react-i18next";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface BillingChoiceOption {
  value: string;
  label: string;
}

interface BillingChoiceProps {
  id: string;
  value: string;
  options: BillingChoiceOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  placeholder?: string;
  emptyLabel?: string;
  allowEmpty?: boolean;
  className?: string;
  ariaLabel?: string;
}

const EMPTY = "__empty__";

export function BillingChoice({
  id,
  value,
  options,
  onChange,
  disabled,
  invalid,
  placeholder,
  emptyLabel,
  allowEmpty = true,
  className,
  ariaLabel,
}: BillingChoiceProps) {
  const { t } = useTranslation();
  const selected = options.find((option) => option.value === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <Button
          id={id}
          type="button"
          variant="outline"
          aria-invalid={invalid || undefined}
          aria-describedby={`${id}-message`}
          aria-label={ariaLabel}
          className={cn(
            "h-10 w-full justify-between px-3 font-normal",
            invalid && "border-destructive",
            className
          )}
        >
          <span
            className={cn("truncate", !selected && "text-muted-foreground")}
          >
            {selected?.label ?? placeholder ?? t("billing.choose")}
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="max-h-72 w-(--radix-dropdown-menu-trigger-width) overflow-y-auto"
      >
        <DropdownMenuRadioGroup
          value={value || EMPTY}
          onValueChange={(next) => onChange(next === EMPTY ? "" : next)}
        >
          {options.map((option) => (
            <DropdownMenuRadioItem
              key={option.value}
              value={option.value}
              className="min-h-10"
            >
              {option.label}
            </DropdownMenuRadioItem>
          ))}
          {allowEmpty && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuRadioItem value={EMPTY} className="min-h-10">
                <span className="text-muted-foreground">
                  {emptyLabel ?? t("billing.notSet")}
                </span>
              </DropdownMenuRadioItem>
            </>
          )}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
