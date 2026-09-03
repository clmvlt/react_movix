import { KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";

interface PharmacyTagProps {
  color?: string | null;
  numero?: string | null;
  size?: "sm" | "md";
  className?: string;
}

export function PharmacyTag({
  color,
  numero,
  size = "sm",
  className,
}: PharmacyTagProps) {
  const dotColor = color?.trim() || null;
  const number = numero?.trim() || null;
  if (!dotColor && !number) return null;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center",
        size === "md" ? "gap-1.5" : "gap-1",
        className
      )}
    >
      {dotColor && (
        <span
          aria-hidden
          className={cn(
            "rounded-full border border-border",
            size === "md" ? "size-3.5" : "size-2.5"
          )}
          style={{ backgroundColor: dotColor }}
        />
      )}
      {number && (
        <span
          className={cn(
            "inline-flex items-center font-medium tabular-nums",
            size === "md"
              ? "gap-1 text-sm text-foreground"
              : "text-xs text-muted-foreground"
          )}
        >
          {size === "md" && (
            <KeyRound
              aria-hidden
              className="size-3.5 shrink-0 text-muted-foreground"
            />
          )}
          {number}
        </span>
      )}
    </span>
  );
}
