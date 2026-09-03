import { Fragment, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { Info, RotateCcw } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingState } from "@/components/states";
import { AccountSaveBar } from "@/components/account/account-save-bar";
import { useApiErrorMessage } from "@/components/account/use-account-error";
import { useAuth } from "@/app/auth-context";
import { useToast } from "@/app/toast-context";
import { usePdfPreview } from "@/app/pdf-preview-context";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import {
  BARCODE_FIELD,
  BARCODE_TEXT_FIELD,
  buildLabelConfig,
  groupCatalog,
  isFieldEffectivelyVisible,
  isLabelConfigDirty,
  labelConfigSignature,
  labelSettingsApi,
  labelSettingsKeys,
  setLabelField,
  toLabelConfigPayload,
  useLabelFieldCatalog,
  useLabelPreview,
  useLabelSettings,
  useResetLabelSettings,
  useUpdateLabelSettings,
  validateLabelConfig,
  ZONE_FIELD,
  type LabelConfig,
  type LabelConfigPayload,
  type LabelFieldConfig,
  type LabelOrientation,
  type LabelTemplate,
  type LabelZoneStyle,
} from "@/features/label-settings";
import { cn } from "@/lib/utils";
import { LabelFieldRow } from "./label-field-row";
import { LabelPreview } from "./label-preview";
import { LabelResetDialog } from "./label-reset-dialog";
import { LabelTemplatePicker } from "./label-template-picker";

const PREVIEW_DEBOUNCE = 400;
const PDF_FILENAME = "movix-label-preview.pdf";

const ORIENTATIONS: { value: LabelOrientation; labelKey: string }[] = [
  { value: "PORTRAIT", labelKey: "labelSettings.orientation.portrait" },
  { value: "LANDSCAPE", labelKey: "labelSettings.orientation.landscape" },
];

const ZONE_STYLES: { value: LabelZoneStyle; labelKey: string }[] = [
  { value: "WHITE_ON_BLACK", labelKey: "labelSettings.zoneStyle.whiteOnBlack" },
  { value: "BLACK_ON_WHITE", labelKey: "labelSettings.zoneStyle.blackOnWhite" },
];

export function LabelSettingsTab() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = user?.isAdmin === true;
  const errorMessage = useApiErrorMessage("labelSettings");

  const catalogQuery = useLabelFieldCatalog();
  const settingsQuery = useLabelSettings();
  const updateSettings = useUpdateLabelSettings();
  const resetSettings = useResetLabelSettings();
  const openPdfPreview = usePdfPreview();

  const queryClient = useQueryClient();
  const [config, setConfig] = useState<LabelConfig | null>(
    () => queryClient.getQueryData<LabelConfig>(labelSettingsKeys.draft()) ?? null
  );
  const [lastValid, setLastValid] = useState<LabelConfigPayload | null>(null);
  const [resetOpen, setResetOpen] = useState(false);

  const catalog = useMemo(() => catalogQuery.data ?? [], [catalogQuery.data]);
  const groups = useMemo(() => groupCatalog(catalog), [catalog]);

  const baseline = useMemo(() => {
    if (catalog.length === 0 || !settingsQuery.data) return null;
    return buildLabelConfig(catalog, settingsQuery.data.config);
  }, [catalog, settingsQuery.data]);

  useEffect(() => {
    if (!baseline) return;
    setConfig((previous) => previous ?? baseline);
  }, [baseline]);

  useEffect(() => {
    if (config) queryClient.setQueryData(labelSettingsKeys.draft(), config);
  }, [config, queryClient]);

  const errors = useMemo(
    () => validateLabelConfig(config, catalog, t),
    [config, catalog, t]
  );
  const hasErrors = Object.keys(errors).length > 0;
  const dirty = isLabelConfigDirty(config, baseline);

  const payload = useMemo(
    () =>
      config && !hasErrors ? toLabelConfigPayload(config, catalog) : null,
    [config, hasErrors, catalog]
  );

  useEffect(() => {
    if (payload) setLastValid(payload);
  }, [payload]);

  const previewConfig = useDebouncedValue(
    payload ?? lastValid,
    PREVIEW_DEBOUNCE
  );
  const previewQuery = useLabelPreview(previewConfig);

  const pending = updateSettings.isPending || resetSettings.isPending;
  const disabled = !isAdmin || pending;

  const handleFieldChange = (key: string, patch: Partial<LabelFieldConfig>) => {
    setConfig((previous) =>
      previous ? setLabelField(previous, key, patch) : previous
    );
  };

  const handleOrientation = (orientation: LabelOrientation) => {
    setConfig((previous) => (previous ? { ...previous, orientation } : previous));
  };

  const handleTemplate = (template: LabelTemplate) => {
    setConfig((previous) => (previous ? { ...previous, template } : previous));
  };

  const handleZoneStyle = (zoneStyle: LabelZoneStyle) => {
    setConfig((previous) => (previous ? { ...previous, zoneStyle } : previous));
  };

  const handleSave = () => {
    if (!payload) return;
    updateSettings.mutate(payload, {
      onSuccess: (settings) => {
        setConfig(buildLabelConfig(catalog, settings.config));
        toast.success(t("account.form.saved"));
      },
      onError: (error) =>
        toast.error(errorMessage(error, "labelSettings.errors.saveFailed")),
    });
  };

  const handleRevert = () => {
    if (!baseline) return;
    setConfig(baseline);
  };

  const handleReset = () => {
    resetSettings.mutate(undefined, {
      onSuccess: (settings) => {
        setConfig(buildLabelConfig(catalog, settings.config));
        setResetOpen(false);
      },
      onError: (error) =>
        toast.error(errorMessage(error, "labelSettings.errors.resetFailed")),
    });
  };

  const handleTestPdf = () => {
    if (!payload) return;
    const config = payload;
    openPdfPreview({
      key: [
        ...labelSettingsKeys.all,
        "preview-pdf",
        labelConfigSignature(config),
      ],
      title: t("labelSettings.preview.pdfTitle"),
      filename: PDF_FILENAME,
      load: () => labelSettingsApi.preview(config, "pdf"),
      describeError: (error) =>
        errorMessage(error, "labelSettings.errors.previewFailed"),
    });
  };

  if (catalogQuery.isLoading || settingsQuery.isLoading) return <LoadingState />;

  if (catalogQuery.isError || settingsQuery.isError) {
    return (
      <Alert variant="warning">
        <AlertDescription>
          {errorMessage(
            catalogQuery.error ?? settingsQuery.error,
            "labelSettings.errors.loadFailed"
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (!config) return <LoadingState />;

  const fieldHint = (key: string): string | null => {
    const hintKey = `labelSettings.fieldHints.${key}`;
    return i18n.exists(hintKey) ? t(hintKey) : null;
  };

  const barcodeVisible = config.fields[BARCODE_FIELD]?.visible !== false;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
        <aside className="order-1 flex flex-col gap-4 xl:sticky xl:top-0 xl:order-2 xl:w-[380px] xl:shrink-0">
          <LabelPreview
            orientation={config.orientation}
            blob={previewQuery.data}
            loading={previewQuery.isFetching}
            error={
              previewQuery.isError
                ? errorMessage(
                    previewQuery.error,
                    "labelSettings.errors.previewFailed"
                  )
                : null
            }
            onTestPdf={handleTestPdf}
          />
        </aside>

        <div className="order-2 flex min-w-0 flex-1 flex-col gap-4 xl:order-1">
          {!isAdmin && (
            <Alert>
              <Info />
              <AlertDescription>{t("labelSettings.readOnly")}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t("labelSettings.template.title")}
              </CardTitle>
              <CardDescription>
                {t("labelSettings.template.subtitle")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LabelTemplatePicker
                value={config.template}
                previewConfig={previewConfig}
                disabled={disabled}
                onChange={handleTemplate}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t("labelSettings.orientation.title")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                role="radiogroup"
                aria-label={t("labelSettings.orientation.title")}
                className="flex flex-wrap gap-2"
              >
                {ORIENTATIONS.map((item) => {
                  const active = config.orientation === item.value;
                  return (
                    <Button
                      key={item.value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      variant={active ? "default" : "outline"}
                      className="min-h-11 flex-1 lg:min-h-10 lg:flex-none"
                      disabled={disabled}
                      onClick={() => handleOrientation(item.value)}
                    >
                      {t(item.labelKey)}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Alert>
            <Info />
            <AlertDescription>
              {t("labelSettings.hints.autoGrow")}
            </AlertDescription>
          </Alert>

          {groups.map((group) => (
            <Card key={group.group}>
              <CardHeader>
                <CardTitle className="text-base">{group.groupLabel}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {group.entries.map((entry) => {
                  const field = config.fields[entry.key];
                  if (!field) return null;
                  const locked =
                    entry.key === BARCODE_TEXT_FIELD && !barcodeVisible;
                  return (
                    <Fragment key={entry.key}>
                      <LabelFieldRow
                        entry={entry}
                        field={field}
                        effectiveVisible={isFieldEffectivelyVisible(
                          config,
                          entry.key
                        )}
                        lockedReason={
                          locked
                            ? t("labelSettings.hints.barcodeTextLocked")
                            : null
                        }
                        hint={fieldHint(entry.key)}
                        error={errors[entry.key] ?? null}
                        disabled={disabled}
                        onChange={(patch) => handleFieldChange(entry.key, patch)}
                      />
                      {entry.key === ZONE_FIELD && (
                        <div className="flex flex-col gap-2 rounded-lg border border-border bg-card px-3 py-2">
                          <span
                            id="label-zone-style-title"
                            className={cn(
                              "text-sm",
                              !field.visible && "text-muted-foreground"
                            )}
                          >
                            {t("labelSettings.zoneStyle.title")}
                          </span>
                          <div
                            role="radiogroup"
                            aria-labelledby="label-zone-style-title"
                            className="flex flex-wrap gap-2"
                          >
                            {ZONE_STYLES.map((item) => {
                              const active = config.zoneStyle === item.value;
                              return (
                                <Button
                                  key={item.value}
                                  type="button"
                                  role="radio"
                                  aria-checked={active}
                                  variant={active ? "default" : "outline"}
                                  className="min-h-11 flex-1 lg:min-h-10 lg:flex-none"
                                  disabled={disabled || !field.visible}
                                  onClick={() => handleZoneStyle(item.value)}
                                >
                                  {t(item.labelKey)}
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </Fragment>
                  );
                })}
              </CardContent>
            </Card>
          ))}

          {isAdmin && (
            <div className="flex flex-col gap-3">
              <Button
                type="button"
                variant="outline"
                className="min-h-11 w-full lg:min-h-10 lg:w-fit"
                disabled={pending || settingsQuery.data?.isDefault === true}
                onClick={() => setResetOpen(true)}
              >
                <RotateCcw />
                {t("labelSettings.reset.action")}
              </Button>
              {hasErrors && (
                <Alert variant="warning">
                  <AlertDescription>
                    {t("labelSettings.errors.fixFields")}
                  </AlertDescription>
                </Alert>
              )}
              <AccountSaveBar
                dirty={dirty}
                pending={pending}
                saveDisabled={hasErrors}
                onSave={handleSave}
                onReset={handleRevert}
              />
            </div>
          )}
        </div>
      </div>

      <LabelResetDialog
        open={resetOpen}
        pending={resetSettings.isPending}
        onOpenChange={(open) => {
          if (resetSettings.isPending) return;
          setResetOpen(open);
        }}
        onConfirm={handleReset}
      />
    </div>
  );
}
