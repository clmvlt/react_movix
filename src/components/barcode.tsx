import { useMemo } from "react";
import { code128 } from "@/lib/barcode";
import { cn } from "@/lib/utils";

interface BarcodeProps {
  value: string;
  className?: string;
  ariaLabel?: string;
}

const BAR_HEIGHT = 100;

export function Barcode({ value, className, ariaLabel }: BarcodeProps) {
  const symbol = useMemo(() => code128(value), [value]);
  if (!symbol) return null;

  return (
    <svg
      viewBox={`0 0 ${symbol.width} ${BAR_HEIGHT}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={ariaLabel ?? value}
      className={cn("w-full", className)}
    >
      {symbol.bars.map((bar) => (
        <rect
          key={bar.x}
          x={bar.x}
          y={0}
          width={bar.width}
          height={BAR_HEIGHT}
          fill="currentColor"
        />
      ))}
    </svg>
  );
}
