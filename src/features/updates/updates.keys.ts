export const updateKeys = {
  all: ["updates"] as const,
  lists: () => [...updateKeys.all, "list"] as const,
  latest: () => [...updateKeys.all, "latest"] as const,
};
