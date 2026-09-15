export const importerTokenKeys = {
  all: ["importer-tokens"] as const,
  lists: () => [...importerTokenKeys.all, "list"] as const,
};
