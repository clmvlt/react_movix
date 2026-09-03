import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/form-field";
import { findTarifTier, type Tarif } from "@/features/tarifs";
import { parseDecimal } from "./tarif-form";

interface TarifSimulatorProps {
  tarifs: Tarif[];
}

export function TarifSimulator({ tarifs }: TarifSimulatorProps) {
  const { t } = useTranslation();
  const [distance, setDistance] = useState("");

  const parsed = parseDecimal(distance);
  const tier = parsed != null && parsed >= 0 ? findTarifTier(tarifs, parsed) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {t("tarifs.simulator.title")}
        </CardTitle>
        <CardDescription>{t("tarifs.simulator.hint")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <FormField
          label={t("tarifs.simulator.distance")}
          htmlFor="tarif-simulator-distance"
        >
          <Input
            id="tarif-simulator-distance"
            inputMode="decimal"
            value={distance}
            onChange={(event) => setDistance(event.target.value)}
            autoComplete="off"
          />
        </FormField>

        {parsed != null && parsed >= 0 && (
          <p className="text-sm text-foreground" aria-live="polite">
            {tier
              ? t("tarifs.simulator.result", {
                  price: tier.prixEuro,
                  km: tier.kmMax,
                })
              : t("tarifs.simulator.noTier")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
