import type { ReactNode } from "react";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface AppFrameProps {
  url: string;
  caption: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function AppFrame({
  url,
  caption,
  children,
  className,
  bodyClassName,
}: AppFrameProps) {
  return (
    <figure
      className={cn(
        "overflow-hidden rounded-xl border bg-card shadow-xl",
        className
      )}
    >
      <div
        className="flex items-center gap-3 border-b bg-muted/60 px-3 py-2"
        aria-hidden
      >
        <span className="flex shrink-0 gap-1.5">
          <span className="size-2.5 rounded-full bg-border" />
          <span className="size-2.5 rounded-full bg-border" />
          <span className="size-2.5 rounded-full bg-border" />
        </span>
        <span className="mx-auto flex min-w-0 max-w-[70%] items-center gap-1.5 rounded-md bg-background px-2.5 py-1 text-[10px] text-muted-foreground">
          <Lock className="size-2.5 shrink-0" />
          <span className="truncate">{url}</span>
        </span>
      </div>
      <div className={cn("bg-background", bodyClassName)} aria-hidden>
        {children}
      </div>
      <figcaption className="sr-only">{caption}</figcaption>
    </figure>
  );
}
