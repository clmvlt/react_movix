export const dashboardKeys = {
  all: ["dashboard"] as const,
  summary: (date: string) => [...dashboardKeys.all, "summary", date] as const,
};
