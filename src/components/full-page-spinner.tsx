import { useTranslation } from "react-i18next";
import logoUrl from "@/assets/images/logo.png";
import { cn } from "@/lib/utils";

type SpinnerSize = "sm" | "md" | "lg";

const RING_SIZES: Record<SpinnerSize, string> = {
  sm: "size-4 border-2",
  md: "size-8 border-3",
  lg: "size-12 border-3",
};

export function Spinner({
  size = "md",
  className,
}: Readonly<{ size?: SpinnerSize; className?: string }>) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block shrink-0 animate-spin rounded-full border-primary/20 border-t-primary motion-reduce:animation-duration-1500",
        RING_SIZES[size],
        className
      )}
    />
  );
}

export function FullPageSpinner({
  className,
}: Readonly<{ className?: string }>) {
  const { t } = useTranslation();
  return (
    <div
      className={cn(
        "flex min-h-screen w-full flex-1 items-center justify-center bg-background",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-4 animate-in fade-in fill-mode-both delay-150 duration-300">
        <div className="relative flex size-16 items-center justify-center">
          <Spinner size="lg" className="absolute inset-0 size-16" />
          <img
            src={logoUrl}
            alt=""
            className="size-8 object-contain dark:brightness-0 dark:invert"
          />
        </div>
        <span className="text-sm text-muted-foreground">
          {t("common.loading")}
        </span>
      </div>
    </div>
  );
}

export function InlineSpinner({
  className,
  label,
  delay = true,
}: Readonly<{ className?: string; label?: string; delay?: boolean }>) {
  const { t } = useTranslation();
  return (
    <div
      className={cn(
        "flex min-h-40 w-full flex-1 flex-col items-center justify-center gap-3 py-8",
        delay && "animate-in fade-in fill-mode-both delay-300 duration-300",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <Spinner />
      <span className="text-sm text-muted-foreground">
        {label ?? t("common.loading")}
      </span>
    </div>
  );
}
