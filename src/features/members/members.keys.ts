export const memberKeys = {
  all: ["members"] as const,
  list: (accountId: string) => [...memberKeys.all, accountId] as const,
};
