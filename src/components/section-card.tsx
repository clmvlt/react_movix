import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  extra?: ReactNode;
  className?: string;
  contentClassName?: string;
  children: ReactNode;
}

export function SectionCard({
  title,
  description,
  icon: Icon,
  extra,
  className,
  contentClassName,
  children,
}: SectionCardProps) {
  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 p-4 pb-3 sm:p-6 sm:pb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {Icon && (
              <Icon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
            )}
            <CardTitle className="text-base leading-6">{title}</CardTitle>
          </div>
          {description && (
            <CardDescription className="mt-1">{description}</CardDescription>
          )}
        </div>
        {extra}
      </CardHeader>
      <CardContent className={cn("p-4 pt-0 sm:p-6 sm:pt-0", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}
