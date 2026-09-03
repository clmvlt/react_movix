export type ApiDate = string;
export type ApiDateTime = string;

export interface CommandExportDetail {
  id: string;
  pharmacyName: string | null;
  pharmacyCip: string | null;
  pharmacyCity: string | null;
  tourOrder: number | null;
  tarif: number;
  distance: number;
  packageCount: number;
  weight: number;
  statusName: string | null;
  statusId: number | null;
  newPharmacy: boolean | null;
  expDate: ApiDateTime | null;
  closeDate: ApiDateTime | null;
  removedDuringDebrief: boolean;
}

export interface TarifCategoryDetail {
  tarifId: string;
  kmMax: number;
  prixEuro: number;
  commandCount: number;
  categoryTotal: number;
}

export interface TourExportItem {
  id: string;
  name: string | null;
  initialDate: ApiDate | null;
  color: string | null;
  immat: string | null;
  zoneName: string | null;
  driverFirstName: string | null;
  driverLastName: string | null;
  driverId: string | null;
  startDate: ApiDateTime | null;
  endDate: ApiDateTime | null;
  durationMinutes: number | null;
  startKm: number | null;
  endKm: number | null;
  realKm: number | null;
  estimateKm: number | null;
  statusName: string | null;
  statusId: number | null;
  totalCommands: number;
  deliveredCommands: number;
  notDeliveredCommands: number;
  totalPackages: number;
  deliveredPackages: number;
  notDeliveredPackages: number;
  totalWeight: number;
  totalPrice: number;
  tarifBreakdown: TarifCategoryDetail[];
  commandsWithoutTarif: number;
  totalCalculatedDistance: number;
  averageDistancePerCommand: number;
  loadingTimeMinutes: number | null;
  sorted: boolean | null;
  commands: CommandExportDetail[];
}

export interface ExportSummary {
  tourCount: number;
  totalCommands: number;
  totalDeliveredCommands: number;
  totalPackages: number;
  totalDeliveredPackages: number;
  totalWeight: number;
  totalPrice: number;
  totalCalculatedDistance: number;
  totalRealKm: number;
}

export interface TourExportDTO {
  tours: TourExportItem[];
  summary: ExportSummary;
}

export interface TourExportParams {
  startDate: ApiDate;
  endDate: ApiDate;
  closedOnly: boolean;
}

export interface TourCommandRow {
  tourId: string;
  tourName: string | null;
  tourDate: ApiDate | null;
  driverName: string;
  immat: string | null;
  zoneName: string | null;
  command: CommandExportDetail;
}

export interface TourTotals extends ExportSummary {
  isLocal: boolean;
  commandsWithoutTarif: number;
  removedCommands: number;
}

export interface DriverAggregate {
  name: string;
  tourCount: number;
  totalCommands: number;
  deliveredCommands: number;
  notDeliveredCommands: number;
  totalPackages: number;
  deliveredPackages: number;
  notDeliveredPackages: number;
  totalWeight: number;
  totalPrice: number;
  totalRealKm: number;
  totalCalculatedDistance: number;
  totalDurationMinutes: number;
}
