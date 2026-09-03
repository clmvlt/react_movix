import * as React from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function FormField({
  label,
  htmlFor,
  error,
  hint,
  required,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
      <p
        id={`${htmlFor}-message`}
        role={error ? "alert" : undefined}
        className={cn(
          "min-h-[1rem] text-xs leading-4",
          error ? "text-destructive" : "text-muted-foreground"
        )}
      >
        {error || hint || ""}
      </p>
    </div>
  );
}
