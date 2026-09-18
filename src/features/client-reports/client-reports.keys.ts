export const clientReportKeys = {
  all: ["client-reports"] as const,
  lists: () => [...clientReportKeys.all, "list"] as const,
};
