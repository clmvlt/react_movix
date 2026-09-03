import { useEffect, useRef, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SettingsTabItem<T extends string> {
  value: T;
  label: string;
  icon: LucideIcon;
  dirty?: boolean;
}

interface SettingsTabsProps<T extends string> {
  items: SettingsTabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  idPrefix: string;
  className?: string;
}

export function SettingsTabs<T extends string>({
  items,
  value,
  onChange,
  idPrefix,
  className,
}: SettingsTabsProps<T>) {
  const { t } = useTranslation();
  const activeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({
      inline: "center",
      block: "nearest",
      behavior: "smooth",
    });
  }, [value]);

  const move = (event: KeyboardEvent<HTMLDivElement>, step: number) => {
    event.preventDefault();
    const index = items.findIndex((item) => item.value === value);
    if (index < 0) return;
    const next = (index + step + items.length) % items.length;
    onChange(items[next].value);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") move(event, 1);
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") move(event, -1);
    else if (event.key === "Home") {
      event.preventDefault();
      onChange(items[0].value);
    } else if (event.key === "End") {
      event.preventDefault();
      onChange(items[items.length - 1].value);
    }
  };

  return (
    <div
      role="tablist"
      onKeyDown={handleKeyDown}
      className={cn(
        "-mx-4 flex shrink-0 items-center gap-1 overflow-x-auto px-4 sm:-mx-6 sm:px-6",
        "lg:mx-0 lg:w-56 lg:flex-col lg:items-stretch lg:self-start lg:overflow-visible lg:rounded-xl lg:border lg:bg-card lg:p-1 lg:px-1",
        className
      )}
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            ref={active ? activeRef : null}
            type="button"
            role="tab"
            id={`${idPrefix}-tab-${item.value}`}
            aria-selected={active}
            aria-controls={`${idPrefix}-panel-${item.value}`}
            aria-label={
              item.dirty ? `${item.label} - ${t("common.unsaved")}` : undefined
            }
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(item.value)}
            className={cn(
              "flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3 text-sm font-medium transition-colors",
              "lg:min-h-10 lg:w-full lg:justify-start",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <item.icon className="size-4 shrink-0" />
            <span className="truncate">{item.label}</span>
            {item.dirty && (
              <span
                aria-hidden
                className={cn(
                  "size-1.5 shrink-0 rounded-full lg:ml-auto",
                  active ? "bg-primary-foreground" : "bg-primary"
                )}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
