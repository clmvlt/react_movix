export type LabelOrientation = "PORTRAIT" | "LANDSCAPE";

export type LabelTemplate = "MODERN" | "CLASSIC";

export type LabelPreviewFormat = "png" | "pdf";

export type LabelZoneStyle = "WHITE_ON_BLACK" | "BLACK_ON_WHITE";

export interface LabelFieldConfig {
  visible: boolean;
  fontSize: number | null;
  bold: boolean;
}

export interface LabelConfig {
  version: number;
  orientation: LabelOrientation;
  template: LabelTemplate;
  zoneStyle: LabelZoneStyle;
  fields: Record<string, LabelFieldConfig>;
}

export interface LabelSettings {
  isDefault: boolean;
  config: LabelConfig;
}

export interface LabelFieldPayload {
  visible: boolean;
  fontSize?: number | null;
  bold?: boolean;
}

export interface LabelConfigPayload {
  version: number;
  orientation: LabelOrientation;
  template: LabelTemplate;
  zoneStyle: LabelZoneStyle;
  fields: Record<string, LabelFieldPayload>;
}

export interface LabelFieldCatalogEntry {
  key: string;
  label: string;
  group: string;
  groupLabel: string;
  supportsFontSize: boolean;
  minFontSize: number | null;
  maxFontSize: number | null;
  defaultFontSize: number | null;
  autoFit: boolean;
  supportsBold: boolean;
  defaultBold: boolean;
  defaultVisible: boolean;
}

export interface LabelFieldGroup {
  group: string;
  groupLabel: string;
  entries: LabelFieldCatalogEntry[];
}

export const BARCODE_FIELD = "BARCODE";
export const BARCODE_TEXT_FIELD = "BARCODE_TEXT";
export const ZONE_FIELD = "ZONE";

export const DEFAULT_ZONE_STYLE: LabelZoneStyle = "WHITE_ON_BLACK";

export const LABEL_CONFIG_VERSION = 1;

export const LABEL_TEMPLATES: LabelTemplate[] = ["MODERN", "CLASSIC"];

export const DEFAULT_LABEL_TEMPLATE: LabelTemplate = "MODERN";

export const LABEL_GROUP_ORDER = [
  "LOGO",
  "SENDER",
  "RECIPIENT",
  "INFO",
  "FOOTER",
  "BARCODE",
];

export const LABEL_PREVIEW_SIZE: Record<
  LabelOrientation,
  { width: number; height: number }
> = {
  PORTRAIT: { width: 295, height: 421 },
  LANDSCAPE: { width: 421, height: 295 },
};
