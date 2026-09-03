export const tarifKeys = {
  all: ["tarifs"] as const,
  lists: () => [...tarifKeys.all, "list"] as const,
};
