import { useTranslation } from "react-i18next";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ANOMALY_TYPE_CODES } from "@/features/anomalies";

interface AnomalyTypeSelectProps {
  id: string;
  value: string;
  onChange: (code: string) => void;
  allowAll?: boolean;
  className?: string;
  invalid?: boolean;
}

export function AnomalyTypeSelect({
  id,
  value,
  onChange,
  allowAll = false,
  className,
  invalid = false,
}: AnomalyTypeSelectProps) {
  const { t } = useTranslation();
  const placeholder = allowAll
    ? t("anomalies.filters.allTypes")
    : t("anomalies.form.typePlaceholder");
  const label = value ? t(`anomalies.types.${value}`) : placeholder;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          aria-label={t("anomalies.form.type")}
          className={cn(
            "min-h-11 w-full justify-between font-normal lg:min-h-10",
            !value && "text-muted-foreground",
            invalid && "border-destructive",
            className
          )}
        >
          <span className="truncate">{label}</span>
          <ChevronDown className="opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[min(20rem,90vw)]">
        {allowAll && (
          <DropdownMenuItem
            className="min-h-11 lg:min-h-9"
            onSelect={() => onChange("")}
          >
            <Check className={cn("opacity-0", value === "" && "opacity-100")} />
            {t("anomalies.filters.allTypes")}
          </DropdownMenuItem>
        )}
        {ANOMALY_TYPE_CODES.map((code) => (
          <DropdownMenuItem
            key={code}
            className="min-h-11 lg:min-h-9"
            onSelect={() => onChange(code)}
          >
            <Check className={cn("opacity-0", value === code && "opacity-100")} />
            {t(`anomalies.types.${code}`)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
