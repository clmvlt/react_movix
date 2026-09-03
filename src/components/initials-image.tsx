import { useState } from "react";
import { cn } from "@/lib/utils";

interface InitialsImageProps {
  src?: string;
  initials: string;
  alt?: string;
  className?: string;
  fallbackClassName?: string;
}

export function InitialsImage({
  src,
  initials,
  alt = "",
  className,
  fallbackClassName,
}: InitialsImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showFallback = !src || failedSrc === src;

  if (showFallback) {
    return (
      <span
        aria-label={alt || undefined}
        className={cn("flex items-center justify-center", className, fallbackClassName)}
      >
        {initials}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailedSrc(src)}
      className={className}
    />
  );
}
