export const tourConfigKeys = {
  all: ["tour-configs"] as const,
  lists: () => [...tourConfigKeys.all, "list"] as const,
  details: () => [...tourConfigKeys.all, "detail"] as const,
  detail: (id: string) => [...tourConfigKeys.details(), id] as const,
};
