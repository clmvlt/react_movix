export const todoKeys = {
  all: ["todos"] as const,
  list: () => [...todoKeys.all, "list"] as const,
  categories: () => [...todoKeys.all, "categories"] as const,
};
