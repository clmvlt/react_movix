export const todoKeys = {
  all: ["todos"] as const,
  list: () => [...todoKeys.all, "list"] as const,
  detail: (id: number) => [...todoKeys.all, "detail", id] as const,
  categories: () => [...todoKeys.all, "categories"] as const,
};
