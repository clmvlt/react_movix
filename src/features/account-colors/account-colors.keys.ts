export const accountColorKeys = {
  all: ["account-colors"] as const,
  list: () => [...accountColorKeys.all, "list"] as const,
};
