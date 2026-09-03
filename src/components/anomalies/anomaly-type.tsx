import { useTranslation } from "react-i18next";
import { StatusBadge } from "@/components/status-badge";
import { anomalyTypeCategory } from "@/lib/status";
import { isKnownAnomalyType, type AnomalyType } from "@/features/anomalies";

export function AnomalyTypeBadge({
  type,
  className,
}: {
  type: AnomalyType | null | undefined;
  className?: string;
}) {
  const { t } = useTranslation();
  if (!type?.code) return null;

  const label = isKnownAnomalyType(type.code)
    ? t(`anomalies.types.${type.code}`)
    : type.name || type.code;

  return (
    <StatusBadge
      label={label}
      category={anomalyTypeCategory(type.code)}
      className={className}
    />
  );
}
