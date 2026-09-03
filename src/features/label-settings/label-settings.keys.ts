export const labelSettingsKeys = {
  all: ["label-settings"] as const,
  settings: () => [...labelSettingsKeys.all, "settings"] as const,
  catalog: () => [...labelSettingsKeys.all, "catalog"] as const,
  draft: () => [...labelSettingsKeys.all, "draft"] as const,
  previews: () => [...labelSettingsKeys.all, "preview"] as const,
  preview: (signature: string) =>
    [...labelSettingsKeys.previews(), signature] as const,
};
