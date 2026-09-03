import { getStatusTokens, type StatusCategory } from "@/lib/colors";
import { cn } from "@/lib/utils";

interface StatBarProps {
  value: number;
  max: number;
  category?: StatusCategory;
  className?: string;
}

function statPercent(value: number, max: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((value / max) * 100)));
}

export function StatBar({
  value,
  max,
  category = "success",
  className,
}: StatBarProps) {
  const tokens = getStatusTokens(category);
  return (
    <div
      className={cn(
        "h-1.5 w-full overflow-hidden rounded-full bg-muted",
        className
      )}
      aria-hidden
    >
      <div
        className="h-full rounded-full transition-[width] duration-300"
        style={{
          width: `${statPercent(value, max)}%`,
          backgroundColor: tokens.strong,
        }}
      />
    </div>
  );
}
