export const pharmacyReportKeys = {
  all: ["pharmacy-reports"] as const,
  lists: () => [...pharmacyReportKeys.all, "list"] as const,
};
