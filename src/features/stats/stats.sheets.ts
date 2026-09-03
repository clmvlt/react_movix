import {
  setWorkbookBooleanLabels,
  summarySheet,
  type SheetSpec,
  type SummaryLine,
  type WorkbookSpec,
} from "@/lib/xlsx";
import type {
  PharmacyStatsParams,
  PharmacyTotals,
  StatsOverview,
  StatsPharmacyItem,
} from "./types";

export type Translate = (
  key: string,
  options?: Record<string, unknown>
) => string;

export const LOW_DELIVERY_RATE_THRESHOLD = 90;

export function computePharmacyTotals(
  pharmacies: StatsPharmacyItem[],
  overview: StatsOverview | null,
  isFullSelection: boolean
): PharmacyTotals {
  const totals: PharmacyTotals = {
    pharmacyCount: pharmacies.length,
    totalCommands: 0,
    deliveredCommands: 0,
    notDeliveredCommands: 0,
    totalPackages: 0,
    deliveredPackages: 0,
    totalWeight: 0,
    deliveryRate: isFullSelection && overview ? overview.deliveryRate : null,
    isLocal: !isFullSelection,
  };

  for (const pharmacy of pharmacies) {
    totals.totalCommands += pharmacy.totalCommands ?? 0;
    totals.deliveredCommands += pharmacy.deliveredCommands ?? 0;
    totals.notDeliveredCommands += pharmacy.notDeliveredCommands ?? 0;
    totals.totalPackages += pharmacy.totalPackages ?? 0;
    totals.deliveredPackages += pharmacy.deliveredPackages ?? 0;
    totals.totalWeight += pharmacy.totalWeight ?? 0;
  }

  return totals;
}

export interface PharmacySheetsInput {
  pharmacies: StatsPharmacyItem[];
  overview: StatsOverview | null;
  totals: PharmacyTotals;
  params: PharmacyStatsParams;
  loadedPharmacyCount: number;
  t: Translate;
}

export function buildPharmacySheets(input: PharmacySheetsInput): WorkbookSpec {
  const { pharmacies, overview, totals, params, loadedPharmacyCount, t } = input;
  setWorkbookBooleanLabels({ yes: t("common.yes"), no: t("common.no") });
  const column = (key: string) => t(`exports.columns.${key}`);

  const appliedFilters = [
    params.pharmacyCip.trim()
      ? `${column("cip")}: ${params.pharmacyCip.trim()}`
      : null,
    params.profilId.trim()
      ? `${column("driver")}: ${params.profilId.trim()}`
      : null,
  ]
    .filter(Boolean)
    .join(" | ");

  const summaryLines: SummaryLine[] = [
    {
      label: t("exports.summary.generatedAt"),
      value: new Date().toISOString(),
      format: "datetime",
    },
    {
      label: t("exports.summary.startDate"),
      value: params.startDate,
      format: "date",
    },
    {
      label: t("exports.summary.endDate"),
      value: params.endDate,
      format: "date",
    },
    {
      label: t("exports.summary.dateField"),
      value: t("exports.summary.dateFieldPharmacies"),
      format: "text",
    },
    {
      label: t("exports.summary.scope"),
      value: t("exports.summary.scopePharmacies"),
      format: "text",
    },
    {
      label: t("exports.summary.appliedFilters"),
      value: appliedFilters || t("exports.summary.noFilter"),
      format: "text",
    },
    {
      label: t("exports.summary.exportedPharmacies"),
      value: pharmacies.length,
      format: "integer",
    },
    {
      label: t("exports.summary.loadedPharmacies"),
      value: loadedPharmacyCount,
      format: "integer",
    },
    {
      label: t("exports.summary.totalsSource"),
      value: totals.isLocal
        ? t("exports.summary.totalsLocalPartial")
        : t("exports.summary.totalsOverview"),
      format: "text",
    },
  ];

  if (overview) {
    summaryLines.push(
      {
        label: column("totalCommands"),
        value: overview.totalCommands,
        format: "integer",
      },
      {
        label: column("delivered"),
        value: overview.deliveredCommands,
        format: "integer",
      },
      {
        label: column("notDelivered"),
        value: overview.notDeliveredCommands,
        format: "integer",
      },
      {
        label: column("loadedCommands"),
        value: overview.loadedCommands,
        format: "integer",
      },
      {
        label: column("pendingCommands"),
        value: overview.pendingCommands,
        format: "integer",
      },
      {
        label: column("missingCommands"),
        value: overview.missingCommands,
        format: "integer",
      },
      {
        label: column("deliveryRate"),
        value: overview.deliveryRate,
        format: "rate",
      },
      {
        label: column("notDeliveryRate"),
        value: overview.notDeliveryRate,
        format: "rate",
      },
      {
        label: column("totalPackages"),
        value: overview.totalPackages,
        format: "integer",
      },
      {
        label: column("deliveredPackages"),
        value: overview.deliveredPackages,
        format: "integer",
      },
      {
        label: column("notDeliveredPackages"),
        value: overview.notDeliveredPackages,
        format: "integer",
      },
      {
        label: column("packageDeliveryRate"),
        value: overview.packageDeliveryRate,
        format: "rate",
      },
      {
        label: column("totalWeight"),
        value: overview.totalWeight,
        format: "weight",
      },
      {
        label: column("avgPackages"),
        value: overview.avgPackagesPerCommand,
        format: "decimal",
      },
      {
        label: column("tourCount"),
        value: overview.totalTours,
        format: "integer",
      },
      {
        label: column("avgCommands"),
        value: overview.avgCommandsPerTour,
        format: "decimal",
      }
    );
  }

  const pharmaciesSheet: SheetSpec<StatsPharmacyItem> = {
    name: t("exports.sheets.pharmacies"),
    rows: pharmacies,
    columns: [
      { header: column("cip"), value: (row) => row.cip, format: "text" },
      { header: column("name"), value: (row) => row.name, format: "text" },
      { header: column("city"), value: (row) => row.city, format: "text" },
      {
        header: column("totalCommands"),
        value: (row) => row.totalCommands,
        format: "integer",
      },
      {
        header: column("delivered"),
        value: (row) => row.deliveredCommands,
        format: "integer",
      },
      {
        header: column("notDelivered"),
        value: (row) => row.notDeliveredCommands,
        format: "integer",
      },
      {
        header: column("totalPackages"),
        value: (row) => row.totalPackages,
        format: "integer",
      },
      {
        header: column("deliveredPackages"),
        value: (row) => row.deliveredPackages,
        format: "integer",
      },
      {
        header: column("deliveryRate"),
        value: (row) => row.deliveryRate,
        format: "rate",
      },
      {
        header: column("totalWeight"),
        value: (row) => row.totalWeight,
        format: "weight",
      },
    ],
    totals: {
      [column("cip")]: t("exports.values.pharmaciesCount", {
        count: pharmacies.length,
      }),
      [column("totalCommands")]: totals.totalCommands,
      [column("delivered")]: totals.deliveredCommands,
      [column("notDelivered")]: totals.notDeliveredCommands,
      [column("totalPackages")]: totals.totalPackages,
      [column("deliveredPackages")]: totals.deliveredPackages,
      [column("deliveryRate")]: totals.deliveryRate,
      [column("totalWeight")]: totals.totalWeight,
    },
  };

  return [
    summarySheet(
      t("exports.sheets.summary"),
      t("exports.summary.metric"),
      t("exports.summary.value"),
      summaryLines
    ),
    pharmaciesSheet,
  ];
}

export function pharmacyStatsFileName(params: PharmacyStatsParams): string {
  return `movix_pharmacy-stats_${params.startDate}_${params.endDate}.xlsx`;
}
