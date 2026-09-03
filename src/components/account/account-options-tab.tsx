import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DetailField } from "@/components/detail-field";
import { FormField } from "@/components/form-field";
import { useProfiles } from "@/features/profiles";
import type { AccountTabProps } from "./account-form";

export function AccountOptionsTab({
  form,
  baseline,
  errors,
  set,
  disabled,
}: AccountTabProps) {
  const { t } = useTranslation();
  const profilesQuery = useProfiles();

  const max = baseline.maxProfiles ?? 0;
  const used = profilesQuery.data?.length;
  const quota =
    used == null
      ? ""
      : max > 0
        ? t("account.options.profilesUsed", { used, max })
        : t("account.options.profilesUnlimited", { used });

  return (
    <div className="grid auto-rows-min grid-cols-1 gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t("account.options.title")}
          </CardTitle>
          <CardDescription>{t("account.options.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <div className="flex min-h-11 items-center gap-3">
            <Checkbox
              id="isScanCIP"
              className="size-5"
              checked={form.isScanCIP}
              onCheckedChange={(value) => set("isScanCIP", value === true)}
              disabled={disabled}
            />
            <Label htmlFor="isScanCIP" className="cursor-pointer">
              {t("account.options.scanCip")}
            </Label>
          </div>
          <p className="text-xs leading-4 text-muted-foreground">
            {t("account.options.scanCipHint")}
          </p>
          <FormField
            label={t("account.options.defaultTourDeparture")}
            htmlFor="defaultTourDepartureTime"
            error={errors.defaultTourDepartureTime}
            hint={t("account.options.defaultTourDepartureHint")}
            className="mt-2"
          >
            <Input
              id="defaultTourDepartureTime"
              type="time"
              value={form.defaultTourDepartureTime}
              onChange={(e) => set("defaultTourDepartureTime", e.target.value)}
              disabled={disabled}
              className="min-h-11 w-fit lg:min-h-10"
            />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t("account.options.profiles")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <dl className="grid grid-cols-1 gap-4">
            <DetailField
              label={t("account.options.profiles")}
              hint={t("account.options.maxProfilesHint")}
            >
              {quota}
            </DetailField>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
