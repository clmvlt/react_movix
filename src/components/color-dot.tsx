import { cn } from "@/lib/utils";

interface ColorDotProps {
  color: string;
  size?: "sm" | "md";
  className?: string;
}

export function ColorDot({ color, size = "sm", className }: ColorDotProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "shrink-0 rounded-full",
        size === "md"
          ? "size-3 translate-y-[1.5px]"
          : "size-2.5 translate-y-px",
        className
      )}
      style={{ backgroundColor: color }}
    />
  );
}
