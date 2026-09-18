import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  clientPlace,
  clientRefLabel,
  type Client,
  type ClientRef,
} from "@/features/clients";
import { ClientSearchDialog } from "./client-search-dialog";
import { ClientTypeIcon } from "./client-type-icon";

interface ClientSelectFieldProps {
  id?: string;
  value: ClientRef | null;
  onChange: (client: Client | null) => void;
  disabled?: boolean;
  invalid?: boolean;
  dialogTitle?: string;
  dialogDescription?: string;
  placeholder?: string;
  className?: string;
}

export function ClientSelectField({
  id,
  value,
  onChange,
  disabled = false,
  invalid = false,
  dialogTitle,
  dialogDescription,
  placeholder,
  className,
}: ClientSelectFieldProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const cip = value?.type === "PHARMACY" ? (value.cip ?? null) : null;
  const code = value?.code?.trim() || null;
  const place = value ? clientPlace(value) : "";
  const secondary = [code, cip, place].filter(Boolean).join(" - ");

  return (
    <div className={cn("flex items-stretch gap-2", className)}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        aria-invalid={invalid || undefined}
        className={cn(
          "flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-left transition-colors lg:min-h-10",
          "hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:cursor-not-allowed disabled:opacity-50",
          invalid && "border-destructive"
        )}
      >
        {value ? (
          <>
            <ClientTypeIcon
              type={value.type}
              className="size-4 shrink-0 text-muted-foreground"
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm text-foreground">
                {clientRefLabel(value) || t("clients.untitled")}
              </span>
              {secondary && (
                <span className="block truncate text-xs text-muted-foreground">
                  {secondary}
                </span>
              )}
            </span>
          </>
        ) : (
          <>
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
              {placeholder ?? t("clients.search.choose")}
            </span>
          </>
        )}
      </button>

      {value && !disabled && (
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-11 shrink-0 lg:size-10"
          onClick={() => onChange(null)}
          aria-label={t("clients.picker.clear")}
        >
          <X />
        </Button>
      )}

      <ClientSearchDialog
        open={open}
        onOpenChange={setOpen}
        onSelect={onChange}
        title={dialogTitle}
        description={dialogDescription}
      />
    </div>
  );
}
