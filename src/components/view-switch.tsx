import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ViewSwitchItem<T extends string> {
  value: T;
  label: string;
  icon: LucideIcon;
  count?: number;
}

interface ViewSwitchProps<T extends string> {
  items: ViewSwitchItem<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: "default" | "sm";
}

export function ViewSwitch<T extends string>({
  items,
  value,
  onChange,
  className,
  size = "default",
}: ViewSwitchProps<T>) {
  const sm = size === "sm";
  return (
    <div
      role="tablist"
      className={cn(
        "flex items-center gap-1 rounded-xl border bg-card p-1",
        sm && "gap-0.5 rounded-lg p-0.5",
        className
      )}
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cn(
              "flex min-h-10 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 text-sm font-medium transition-colors",
              sm && "gap-1 rounded-md text-xs lg:min-h-7",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <item.icon className={cn("size-4 shrink-0", sm && "size-3.5")} />
            <span className="truncate">{item.label}</span>
            {item.count != null && (
              <span
                className={cn(
                  "shrink-0 rounded-full px-1.5 text-xs tabular-nums",
                  active ? "bg-primary-foreground/20" : "bg-muted"
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
