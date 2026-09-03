export const accountKeys = {
  all: ["account"] as const,
  detail: () => [...accountKeys.all, "detail"] as const,
  list: () => [...accountKeys.all, "list"] as const,
};
