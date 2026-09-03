export const importerTokenKeys = {
  all: ["importer-tokens"] as const,
  lists: () => [...importerTokenKeys.all, "list"] as const,
  detail: (id: string) => [...importerTokenKeys.all, "detail", id] as const,
  global: () => [...importerTokenKeys.all, "global"] as const,
  globalList: () => [...importerTokenKeys.global(), "list"] as const,
  globalDetail: (id: string) =>
    [...importerTokenKeys.global(), "detail", id] as const,
};
