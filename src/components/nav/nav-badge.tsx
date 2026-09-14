import { cn } from "@/lib/utils";

export function NavCountBadge({
  count,
  className,
}: {
  count: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-status-warning-strong px-1 text-[10px] font-semibold leading-4 text-status-warning-bg tabular-nums",
        className
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
