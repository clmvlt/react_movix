import {
  BARCODE_FIELD,
  BARCODE_TEXT_FIELD,
  DEFAULT_LABEL_TEMPLATE,
  DEFAULT_ZONE_STYLE,
  LABEL_CONFIG_VERSION,
  LABEL_GROUP_ORDER,
  type LabelConfig,
  type LabelConfigPayload,
  type LabelFieldCatalogEntry,
  type LabelFieldConfig,
  type LabelFieldGroup,
  type LabelFieldPayload,
} from "./types";

export function buildLabelConfig(
  catalog: LabelFieldCatalogEntry[],
  saved: LabelConfig | null | undefined
): LabelConfig {
  const fields: Record<string, LabelFieldConfig> = {};

  for (const entry of catalog) {
    const current = saved?.fields?.[entry.key];
    const savedSize = current ? (current.fontSize ?? null) : entry.defaultFontSize;
    fields[entry.key] = {
      visible: current ? current.visible === true : entry.defaultVisible,
      fontSize:
        savedSize === null && entry.supportsFontSize && !entry.autoFit
          ? fontSizeFallback(entry)
          : savedSize,
      bold: current ? current.bold === true : entry.defaultBold,
    };
  }

  return {
    version: saved?.version ?? LABEL_CONFIG_VERSION,
    orientation: saved?.orientation === "LANDSCAPE" ? "LANDSCAPE" : "PORTRAIT",
    template:
      saved?.template === "CLASSIC" ? "CLASSIC" : DEFAULT_LABEL_TEMPLATE,
    zoneStyle:
      saved?.zoneStyle === "BLACK_ON_WHITE"
        ? "BLACK_ON_WHITE"
        : DEFAULT_ZONE_STYLE,
    fields,
  };
}

export function toLabelConfigPayload(
  config: LabelConfig,
  catalog: LabelFieldCatalogEntry[]
): LabelConfigPayload {
  const fields: Record<string, LabelFieldPayload> = {};

  for (const entry of catalog) {
    const field = config.fields[entry.key];
    if (!field) continue;
    const payload: LabelFieldPayload = { visible: field.visible };
    if (entry.supportsFontSize) payload.fontSize = field.fontSize;
    if (entry.supportsBold) payload.bold = field.bold;
    fields[entry.key] = payload;
  }

  return {
    version: config.version,
    orientation: config.orientation,
    template: config.template,
    zoneStyle: config.zoneStyle,
    fields,
  };
}

export function groupCatalog(
  catalog: LabelFieldCatalogEntry[]
): LabelFieldGroup[] {
  const groups: LabelFieldGroup[] = [];

  for (const entry of catalog) {
    const existing = groups.find((group) => group.group === entry.group);
    if (existing) existing.entries.push(entry);
    else
      groups.push({
        group: entry.group,
        groupLabel: entry.groupLabel,
        entries: [entry],
      });
  }

  const rank = (group: string) => {
    const index = LABEL_GROUP_ORDER.indexOf(group);
    return index < 0 ? LABEL_GROUP_ORDER.length : index;
  };

  return groups
    .map((group, index) => ({ group, index }))
    .sort((a, b) => {
      const delta = rank(a.group.group) - rank(b.group.group);
      return delta !== 0 ? delta : a.index - b.index;
    })
    .map((item) => item.group);
}

export function labelConfigSignature(
  config: LabelConfig | LabelConfigPayload | null
): string {
  if (!config) return "";
  const keys = Object.keys(config.fields).sort();
  return JSON.stringify([
    config.version,
    config.orientation,
    config.template,
    config.zoneStyle,
    keys.map((key) => {
      const field = config.fields[key];
      return [key, field.visible, field.fontSize ?? null, field.bold ?? null];
    }),
  ]);
}

export function isLabelConfigDirty(
  config: LabelConfig | null,
  baseline: LabelConfig | null
): boolean {
  if (!config || !baseline) return false;
  return labelConfigSignature(config) !== labelConfigSignature(baseline);
}

export function setLabelField(
  config: LabelConfig,
  key: string,
  patch: Partial<LabelFieldConfig>
): LabelConfig {
  const current = config.fields[key];
  if (!current) return config;
  return {
    ...config,
    fields: { ...config.fields, [key]: { ...current, ...patch } },
  };
}

export function isFieldEffectivelyVisible(
  config: LabelConfig,
  key: string
): boolean {
  const field = config.fields[key];
  if (!field?.visible) return false;
  if (key !== BARCODE_TEXT_FIELD) return true;
  const parent = config.fields[BARCODE_FIELD];
  return parent ? parent.visible : true;
}

export function fontSizeFallback(entry: LabelFieldCatalogEntry): number {
  return (
    entry.defaultFontSize ?? entry.maxFontSize ?? entry.minFontSize ?? 10
  );
}

type Translate = (key: string, options?: Record<string, unknown>) => string;

export function validateLabelConfig(
  config: LabelConfig | null,
  catalog: LabelFieldCatalogEntry[],
  t: Translate
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!config) return errors;

  for (const entry of catalog) {
    const field = config.fields[entry.key];
    if (!field || !entry.supportsFontSize) continue;
    const size = field.fontSize;
    if (size === null) continue;

    const min = entry.minFontSize;
    const max = entry.maxFontSize;
    if (!Number.isFinite(size) || !Number.isInteger(size)) {
      errors[entry.key] = t("labelSettings.errors.fontSizeNumber");
      continue;
    }
    if (
      (min !== null && size < min) ||
      (max !== null && size > max)
    ) {
      errors[entry.key] = t("labelSettings.errors.fontSizeRange", {
        min: min ?? 0,
        max: max ?? 0,
      });
    }
  }

  return errors;
}
