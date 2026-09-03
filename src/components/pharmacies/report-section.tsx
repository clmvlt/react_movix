import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReportSectionProps {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function ReportSection({
  title,
  count,
  defaultOpen = false,
  children,
}: ReportSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [everOpened, setEverOpened] = useState(defaultOpen);

  const toggle = () => {
    setOpen((prev) => !prev);
    setEverOpened(true);
  };

  return (
    <section className="shrink-0 rounded-xl border bg-card">
      <button
        type="button"
        aria-expanded={open}
        onClick={toggle}
        className="flex min-h-11 w-full items-center justify-between gap-2 rounded-xl px-4 py-2 text-left transition-colors hover:bg-accent/30"
      >
        <span className="min-w-0 truncate text-sm font-medium text-foreground">
          {title}
          {count != null && (
            <span className="ml-1.5 text-muted-foreground">({count})</span>
          )}
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {everOpened && (
        <div className={cn("border-t p-4", !open && "hidden")}>{children}</div>
      )}
    </section>
  );
}
