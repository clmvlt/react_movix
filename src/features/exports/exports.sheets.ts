import {
  setWorkbookBooleanLabels,
  summarySheet,
  type SheetSpec,
  type SummaryLine,
  type WorkbookSpec,
} from "@/lib/xlsx";
import type {
  DriverAggregate,
  TarifCategoryDetail,
  TourCommandRow,
  TourExportItem,
  TourExportParams,
  TourTotals,
} from "./types";

export type Translate = (
  key: string,
  options?: Record<string, unknown>
) => string;

export function tourDriverName(
  tour: TourExportItem,
  unassignedLabel: string
): string {
  const name = [tour.driverFirstName, tour.driverLastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return name || unassignedLabel;
}

function isDelivered(statusId: number | null): boolean {
  return statusId === 3 || statusId === 5;
}

export function computeTourTotals(
  tours: TourExportItem[],
  excludeRemoved: boolean
): TourTotals {
  const totals: TourTotals = {
    isLocal: true,
    tourCount: tours.length,
    totalCommands: 0,
    totalDeliveredCommands: 0,
    totalPackages: 0,
    totalDeliveredPackages: 0,
    totalWeight: 0,
    totalPrice: 0,
    totalCalculatedDistance: 0,
    totalRealKm: 0,
    commandsWithoutTarif: 0,
    removedCommands: 0,
  };

  for (const tour of tours) {
    totals.totalCommands += tour.totalCommands ?? 0;
    totals.totalDeliveredCommands += tour.deliveredCommands ?? 0;
    totals.totalPackages += tour.totalPackages ?? 0;
    totals.totalDeliveredPackages += tour.deliveredPackages ?? 0;
    totals.totalWeight += tour.totalWeight ?? 0;
    totals.totalPrice += tour.totalPrice ?? 0;
    totals.totalCalculatedDistance += tour.totalCalculatedDistance ?? 0;
    totals.totalRealKm += tour.realKm ?? 0;
    totals.commandsWithoutTarif += tour.commandsWithoutTarif ?? 0;

    for (const command of tour.commands) {
      if (!command.removedDuringDebrief) continue;
      totals.removedCommands += 1;
      if (!excludeRemoved) continue;
      totals.totalCommands -= 1;
      totals.totalPackages -= command.packageCount ?? 0;
      totals.totalWeight -= command.weight ?? 0;
      totals.totalPrice -= command.tarif ?? 0;
      totals.totalCalculatedDistance -= command.distance ?? 0;
      if (isDelivered(command.statusId)) totals.totalDeliveredCommands -= 1;
      if (command.statusId === 3) {
        totals.totalDeliveredPackages -= command.packageCount ?? 0;
      }
    }
  }

  return totals;
}

export function flattenTourCommands(
  tours: TourExportItem[],
  excludeRemoved: boolean,
  unassignedLabel: string
): TourCommandRow[] {
  const rows: TourCommandRow[] = [];
  for (const tour of tours) {
    const driverName = tourDriverName(tour, unassignedLabel);
    for (const command of tour.commands) {
      if (excludeRemoved && command.removedDuringDebrief) continue;
      rows.push({
        tourId: tour.id,
        tourName: tour.name,
        tourDate: tour.initialDate,
        driverName,
        immat: tour.immat,
        zoneName: tour.zoneName,
        command,
      });
    }
  }
  return rows;
}

export function aggregateByDriver(
  tours: TourExportItem[],
  unassignedLabel: string
): DriverAggregate[] {
  const byDriver = new Map<string, DriverAggregate>();

  for (const tour of tours) {
    const key = tour.driverId ?? "__unassigned__";
    let aggregate = byDriver.get(key);
    if (!aggregate) {
      aggregate = {
        name: tourDriverName(tour, unassignedLabel),
        tourCount: 0,
        totalCommands: 0,
        deliveredCommands: 0,
        notDeliveredCommands: 0,
        totalPackages: 0,
        deliveredPackages: 0,
        notDeliveredPackages: 0,
        totalWeight: 0,
        totalPrice: 0,
        totalRealKm: 0,
        totalCalculatedDistance: 0,
        totalDurationMinutes: 0,
      };
      byDriver.set(key, aggregate);
    }
    aggregate.tourCount += 1;
    aggregate.totalCommands += tour.totalCommands ?? 0;
    aggregate.deliveredCommands += tour.deliveredCommands ?? 0;
    aggregate.notDeliveredCommands += tour.notDeliveredCommands ?? 0;
    aggregate.totalPackages += tour.totalPackages ?? 0;
    aggregate.deliveredPackages += tour.deliveredPackages ?? 0;
    aggregate.notDeliveredPackages += tour.notDeliveredPackages ?? 0;
    aggregate.totalWeight += tour.totalWeight ?? 0;
    aggregate.totalPrice += tour.totalPrice ?? 0;
    aggregate.totalRealKm += tour.realKm ?? 0;
    aggregate.totalCalculatedDistance += tour.totalCalculatedDistance ?? 0;
    aggregate.totalDurationMinutes += tour.durationMinutes ?? 0;
  }

  return Array.from(byDriver.values());
}

export function removedCommandCount(tour: TourExportItem): number {
  return tour.commands.filter((command) => command.removedDuringDebrief).length;
}

export function otherStatusCount(tour: TourExportItem): number {
  return (
    (tour.totalCommands ?? 0) -
    (tour.deliveredCommands ?? 0) -
    (tour.notDeliveredCommands ?? 0)
  );
}

interface TarifRow extends TarifCategoryDetail {
  tourName: string | null;
  tourDate: string | null;
}

export interface TourSheetsInput {
  tours: TourExportItem[];
  totals: TourTotals;
  params: TourExportParams;
  excludeRemoved: boolean;
  loadedTourCount: number;
  t: Translate;
}

function sum<T>(rows: T[], pick: (row: T) => number): number {
  return rows.reduce((total, row) => total + (pick(row) ?? 0), 0);
}

export function buildTourSheets(input: TourSheetsInput): WorkbookSpec {
  const { tours, totals, params, excludeRemoved, loadedTourCount, t } = input;
  setWorkbookBooleanLabels({ yes: t("common.yes"), no: t("common.no") });
  const column = (key: string) => t(`exports.columns.${key}`);
  const unassigned = t("exports.values.unassigned");

  const isPartialSelection = tours.length !== loadedTourCount;
  const totalsSource = !totals.isLocal
    ? t("exports.summary.totalsServer")
    : isPartialSelection && excludeRemoved
      ? t("exports.summary.totalsLocalBoth")
      : isPartialSelection
        ? t("exports.summary.totalsLocalPartial")
        : excludeRemoved
          ? t("exports.summary.totalsLocalHidden")
          : t("exports.summary.totalsLocal");

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
      label: t("exports.summary.closedOnly"),
      value: params.closedOnly,
      format: "boolean",
    },
    {
      label: t("exports.summary.dateField"),
      value: t("exports.summary.dateFieldTours"),
      format: "text",
    },
    {
      label: t("exports.summary.scope"),
      value: t("exports.summary.scopeTours"),
      format: "text",
    },
    {
      label: t("exports.summary.removedPolicy"),
      value: excludeRemoved
        ? t("exports.summary.removedHidden")
        : t("exports.summary.removedIncluded"),
      format: "text",
    },
    {
      label: t("exports.summary.totalsSource"),
      value: totalsSource,
      format: "text",
    },
    {
      label: t("exports.summary.exportedTours"),
      value: tours.length,
      format: "integer",
    },
    {
      label: t("exports.summary.loadedTours"),
      value: loadedTourCount,
      format: "integer",
    },
    {
      label: column("totalCommands"),
      value: totals.totalCommands,
      format: "integer",
    },
    {
      label: column("delivered"),
      value: totals.totalDeliveredCommands,
      format: "integer",
    },
    {
      label: column("removedDebrief"),
      value: totals.removedCommands,
      format: "integer",
    },
    {
      label: column("totalPackages"),
      value: totals.totalPackages,
      format: "integer",
    },
    {
      label: column("deliveredPackages"),
      value: totals.totalDeliveredPackages,
      format: "integer",
    },
    {
      label: column("totalWeight"),
      value: totals.totalWeight,
      format: "weight",
    },
    {
      label: column("totalPrice"),
      value: totals.totalPrice,
      format: "currency",
    },
    {
      label: column("calculatedDistance"),
      value: totals.totalCalculatedDistance,
      format: "distance",
    },
    {
      label: column("realKm"),
      value: totals.totalRealKm,
      format: "distance",
    },
    {
      label: column("withoutTarif"),
      value: totals.commandsWithoutTarif,
      format: "integer",
    },
    {
      label: t("exports.summary.tarifNoteLabel"),
      value: t("exports.summary.tarifNote"),
      format: "text",
    },
  ];

  const toursSheet: SheetSpec<TourExportItem> = {
    name: t("exports.sheets.tours"),
    rows: tours,
    columns: [
      { header: column("id"), value: (tour) => tour.id, format: "text" },
      { header: column("name"), value: (tour) => tour.name, format: "text" },
      {
        header: column("date"),
        value: (tour) => tour.initialDate,
        format: "date",
      },
      { header: column("zone"), value: (tour) => tour.zoneName, format: "text" },
      {
        header: column("driver"),
        value: (tour) => tourDriverName(tour, unassigned),
        format: "text",
      },
      { header: column("immat"), value: (tour) => tour.immat, format: "text" },
      {
        header: column("status"),
        value: (tour) => tour.statusName,
        format: "text",
      },
      {
        header: column("start"),
        value: (tour) => tour.startDate,
        format: "datetime",
      },
      {
        header: column("end"),
        value: (tour) => tour.endDate,
        format: "datetime",
      },
      {
        header: column("durationMinutes"),
        value: (tour) => tour.durationMinutes,
        format: "decimal",
      },
      {
        header: column("startKm"),
        value: (tour) => tour.startKm,
        format: "integer",
      },
      {
        header: column("endKm"),
        value: (tour) => tour.endKm,
        format: "integer",
      },
      {
        header: column("realKm"),
        value: (tour) => tour.realKm,
        format: "distance",
      },
      {
        header: column("estimateKm"),
        value: (tour) => tour.estimateKm,
        format: "distance",
      },
      {
        header: column("calculatedDistance"),
        value: (tour) => tour.totalCalculatedDistance,
        format: "distance",
      },
      {
        header: column("avgDistance"),
        value: (tour) => tour.averageDistancePerCommand,
        format: "distance",
      },
      {
        header: column("loadingMinutes"),
        value: (tour) => tour.loadingTimeMinutes,
        format: "decimal",
      },
      {
        header: column("sorted"),
        value: (tour) => tour.sorted,
        format: "boolean",
      },
      {
        header: column("totalCommands"),
        value: (tour) => tour.totalCommands,
        format: "integer",
      },
      {
        header: column("delivered"),
        value: (tour) => tour.deliveredCommands,
        format: "integer",
      },
      {
        header: column("notDelivered"),
        value: (tour) => tour.notDeliveredCommands,
        format: "integer",
      },
      {
        header: column("otherStatuses"),
        value: (tour) => otherStatusCount(tour),
        format: "integer",
      },
      {
        header: column("totalPackages"),
        value: (tour) => tour.totalPackages,
        format: "integer",
      },
      {
        header: column("deliveredPackages"),
        value: (tour) => tour.deliveredPackages,
        format: "integer",
      },
      {
        header: column("notDeliveredPackages"),
        value: (tour) => tour.notDeliveredPackages,
        format: "integer",
      },
      {
        header: column("totalWeight"),
        value: (tour) => tour.totalWeight,
        format: "weight",
      },
      {
        header: column("totalPrice"),
        value: (tour) => tour.totalPrice,
        format: "currency",
      },
      {
        header: column("withoutTarif"),
        value: (tour) => tour.commandsWithoutTarif,
        format: "integer",
      },
      {
        header: column("removedDebrief"),
        value: (tour) => removedCommandCount(tour),
        format: "integer",
      },
    ],
    totals: {
      [column("id")]: t("exports.values.toursCount", { count: tours.length }),
      [column("durationMinutes")]: sum(tours, (tour) => tour.durationMinutes ?? 0),
      [column("realKm")]: sum(tours, (tour) => tour.realKm ?? 0),
      [column("estimateKm")]: sum(tours, (tour) => tour.estimateKm ?? 0),
      [column("calculatedDistance")]: sum(
        tours,
        (tour) => tour.totalCalculatedDistance ?? 0
      ),
      [column("loadingMinutes")]: sum(
        tours,
        (tour) => tour.loadingTimeMinutes ?? 0
      ),
      [column("totalCommands")]: sum(tours, (tour) => tour.totalCommands ?? 0),
      [column("delivered")]: sum(tours, (tour) => tour.deliveredCommands ?? 0),
      [column("notDelivered")]: sum(
        tours,
        (tour) => tour.notDeliveredCommands ?? 0
      ),
      [column("totalPackages")]: sum(tours, (tour) => tour.totalPackages ?? 0),
      [column("deliveredPackages")]: sum(
        tours,
        (tour) => tour.deliveredPackages ?? 0
      ),
      [column("notDeliveredPackages")]: sum(
        tours,
        (tour) => tour.notDeliveredPackages ?? 0
      ),
      [column("totalWeight")]: sum(tours, (tour) => tour.totalWeight ?? 0),
      [column("totalPrice")]: sum(tours, (tour) => tour.totalPrice ?? 0),
      [column("withoutTarif")]: sum(
        tours,
        (tour) => tour.commandsWithoutTarif ?? 0
      ),
    },
  };

  const commandRows = flattenTourCommands(tours, excludeRemoved, unassigned);
  const commandsSheet: SheetSpec<TourCommandRow> = {
    name: t("exports.sheets.commands"),
    rows: commandRows,
    columns: [
      { header: column("tour"), value: (row) => row.tourName, format: "text" },
      {
        header: column("tourDate"),
        value: (row) => row.tourDate,
        format: "date",
      },
      {
        header: column("driver"),
        value: (row) => row.driverName,
        format: "text",
      },
      { header: column("immat"), value: (row) => row.immat, format: "text" },
      { header: column("zone"), value: (row) => row.zoneName, format: "text" },
      {
        header: column("commandId"),
        value: (row) => row.command.id,
        format: "text",
      },
      {
        header: column("pharmacy"),
        value: (row) => row.command.pharmacyName,
        format: "text",
      },
      {
        header: column("cip"),
        value: (row) => row.command.pharmacyCip,
        format: "text",
      },
      {
        header: column("city"),
        value: (row) => row.command.pharmacyCity,
        format: "text",
      },
      {
        header: column("order"),
        value: (row) => row.command.tourOrder,
        format: "integer",
      },
      {
        header: column("tarif"),
        value: (row) => row.command.tarif,
        format: "currency",
      },
      {
        header: column("distance"),
        value: (row) => row.command.distance,
        format: "distance",
      },
      {
        header: column("packages"),
        value: (row) => row.command.packageCount,
        format: "integer",
      },
      {
        header: column("weight"),
        value: (row) => row.command.weight,
        format: "weight",
      },
      {
        header: column("status"),
        value: (row) => row.command.statusName,
        format: "text",
      },
      {
        header: column("newPharmacy"),
        value: (row) => row.command.newPharmacy,
        format: "boolean",
      },
      {
        header: column("removedDebrief"),
        value: (row) => row.command.removedDuringDebrief,
        format: "boolean",
      },
      {
        header: column("expDate"),
        value: (row) => row.command.expDate,
        format: "datetime",
      },
      {
        header: column("closeDate"),
        value: (row) => row.command.closeDate,
        format: "datetime",
      },
    ],
    totals: {
      [column("tour")]: t("exports.values.commandsCount", {
        count: commandRows.length,
      }),
      [column("tarif")]: sum(commandRows, (row) => row.command.tarif ?? 0),
      [column("distance")]: sum(commandRows, (row) => row.command.distance ?? 0),
      [column("packages")]: sum(
        commandRows,
        (row) => row.command.packageCount ?? 0
      ),
      [column("weight")]: sum(commandRows, (row) => row.command.weight ?? 0),
    },
  };

  const tarifRows: TarifRow[] = [];
  for (const tour of tours) {
    for (const breakdown of tour.tarifBreakdown ?? []) {
      tarifRows.push({
        ...breakdown,
        tourName: tour.name,
        tourDate: tour.initialDate,
      });
    }
  }

  const tarifsSheet: SheetSpec<TarifRow> = {
    name: t("exports.sheets.tarifs"),
    rows: tarifRows,
    note: t("exports.summary.tarifNote"),
    columns: [
      { header: column("tour"), value: (row) => row.tourName, format: "text" },
      { header: column("date"), value: (row) => row.tourDate, format: "date" },
      { header: column("tarifId"), value: (row) => row.tarifId, format: "text" },
      {
        header: column("kmMax"),
        value: (row) => row.kmMax,
        format: "distance",
      },
      {
        header: column("unitPrice"),
        value: (row) => row.prixEuro,
        format: "currency",
      },
      {
        header: column("commandCount"),
        value: (row) => row.commandCount,
        format: "integer",
      },
      {
        header: column("categoryTotal"),
        value: (row) => row.categoryTotal,
        format: "currency",
      },
    ],
    totals: tarifRows.length
      ? {
          [column("tour")]: t("exports.values.tarifsCount", {
            count: tarifRows.length,
          }),
          [column("commandCount")]: sum(tarifRows, (row) => row.commandCount),
          [column("categoryTotal")]: sum(tarifRows, (row) => row.categoryTotal),
        }
      : null,
  };

  const driverRows = aggregateByDriver(tours, unassigned);
  const driversSheet: SheetSpec<DriverAggregate> = {
    name: t("exports.sheets.drivers"),
    rows: driverRows,
    columns: [
      { header: column("driver"), value: (row) => row.name, format: "text" },
      {
        header: column("tourCount"),
        value: (row) => row.tourCount,
        format: "integer",
      },
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
        header: column("notDeliveredPackages"),
        value: (row) => row.notDeliveredPackages,
        format: "integer",
      },
      {
        header: column("totalWeight"),
        value: (row) => row.totalWeight,
        format: "weight",
      },
      {
        header: column("totalPrice"),
        value: (row) => row.totalPrice,
        format: "currency",
      },
      {
        header: column("realKm"),
        value: (row) => row.totalRealKm,
        format: "distance",
      },
      {
        header: column("calculatedDistance"),
        value: (row) => row.totalCalculatedDistance,
        format: "distance",
      },
      {
        header: column("totalDuration"),
        value: (row) => row.totalDurationMinutes,
        format: "decimal",
      },
    ],
    totals: {
      [column("driver")]: t("exports.values.driversCount", {
        count: driverRows.length,
      }),
      [column("tourCount")]: sum(driverRows, (row) => row.tourCount),
      [column("totalCommands")]: sum(driverRows, (row) => row.totalCommands),
      [column("delivered")]: sum(driverRows, (row) => row.deliveredCommands),
      [column("notDelivered")]: sum(
        driverRows,
        (row) => row.notDeliveredCommands
      ),
      [column("totalPackages")]: sum(driverRows, (row) => row.totalPackages),
      [column("deliveredPackages")]: sum(
        driverRows,
        (row) => row.deliveredPackages
      ),
      [column("notDeliveredPackages")]: sum(
        driverRows,
        (row) => row.notDeliveredPackages
      ),
      [column("totalWeight")]: sum(driverRows, (row) => row.totalWeight),
      [column("totalPrice")]: sum(driverRows, (row) => row.totalPrice),
      [column("realKm")]: sum(driverRows, (row) => row.totalRealKm),
      [column("calculatedDistance")]: sum(
        driverRows,
        (row) => row.totalCalculatedDistance
      ),
      [column("totalDuration")]: sum(
        driverRows,
        (row) => row.totalDurationMinutes
      ),
    },
  };

  return [
    summarySheet(
      t("exports.sheets.summary"),
      t("exports.summary.metric"),
      t("exports.summary.value"),
      summaryLines
    ),
    toursSheet,
    commandsSheet,
    tarifsSheet,
    driversSheet,
  ];
}

export function tourExportFileName(params: TourExportParams): string {
  const suffix = params.closedOnly ? "_closed" : "";
  return `movix_tours_${params.startDate}_${params.endDate}${suffix}.xlsx`;
}
