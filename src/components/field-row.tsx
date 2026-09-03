import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type FieldRowTone = "default" | "warning";

interface FieldRowProps {
  icon: LucideIcon;
  label: ReactNode;
  summary?: ReactNode;
  active?: boolean;
  tone?: FieldRowTone;
  control?: ReactNode;
  htmlFor?: string;
  children?: ReactNode;
  className?: string;
}

export function FieldRow({
  icon: Icon,
  label,
  summary,
  active = false,
  tone = "default",
  control,
  htmlFor,
  children,
  className,
}: FieldRowProps) {
  const warning = tone === "warning";
  const header = (
    <>
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full",
          warning
            ? "bg-status-warning-bg text-status-warning-text"
            : active
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
        )}
      >
        <Icon aria-hidden className="size-4" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-medium">{label}</span>
        {summary != null && summary !== "" && (
          <span className="line-clamp-2 text-xs text-muted-foreground">
            {summary}
          </span>
        )}
      </span>
      {control}
    </>
  );
  const headerClassName = "flex min-h-14 items-center gap-3 px-3 py-2";

  return (
    <div
      className={cn(
        "rounded-lg border border-border",
        active && !warning && "border-primary/40",
        warning && "border-status-warning-strong/40",
        className
      )}
    >
      {htmlFor ? (
        <label htmlFor={htmlFor} className={cn(headerClassName, "cursor-pointer")}>
          {header}
        </label>
      ) : (
        <div className={headerClassName}>{header}</div>
      )}
      {children && (
        <div className="border-t border-border px-3 pb-3 pt-3">{children}</div>
      )}
    </div>
  );
}

interface SwitchRowProps {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  icon: LucideIcon;
  label: string;
  summary?: ReactNode;
  disabled?: boolean;
  className?: string;
}

export function SwitchRow({
  id,
  checked,
  onCheckedChange,
  icon,
  label,
  summary,
  disabled,
  className,
}: SwitchRowProps) {
  return (
    <FieldRow
      icon={icon}
      label={label}
      summary={summary}
      active={checked}
      htmlFor={id}
      className={className}
      control={
        <Switch
          id={id}
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
          aria-label={label}
        />
      }
    />
  );
}
