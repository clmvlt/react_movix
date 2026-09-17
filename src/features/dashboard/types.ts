export interface DashboardStatusCount {
  statusId: number;
  name: string;
  count: number;
}

export interface DashboardCommands {
  total: number;
  assigned: number;
  unassigned: number;
  pending: number;
  loaded: number;
  delivered: number;
  notDelivered: number;
  missing: number;
  deliveryRate: number;
  newPharmacies: number;
  withoutCoordinates: number;
  byStatus: DashboardStatusCount[];
}

export interface DashboardPackages {
  total: number;
  delivered: number;
  notDelivered: number;
  totalWeight: number;
}

export interface DashboardTours {
  total: number;
  closed: number;
  unsorted: number;
  routeStale: number;
  withoutDriver: number;
  estimateKm: number;
  estimateMins: number;
  byStatus: DashboardStatusCount[];
}

export interface DashboardTourDriver {
  id: string;
  name: string;
}

export interface DashboardTourStatus {
  id: number;
  name: string;
}

export interface DashboardTourProgress {
  id: string;
  name: string;
  color?: string | null;
  status?: DashboardTourStatus | null;
  driver?: DashboardTourDriver | null;
  commandCount: number;
  delivered: number;
  notDelivered: number;
  remaining: number;
  packagesCount: number;
  estimateKm?: number | null;
  estimateMins?: number | null;
  departureTime?: string | null;
  estimatedEndTime?: string | null;
  sorted: boolean;
  routeStale: boolean;
  lastActivityAt?: string | null;
}

export interface DashboardUnpaidSubscriptionInvoices {
  count: number;
  amountTTC: number;
}

export interface DashboardAttention {
  souffranceTotal: number;
  anomaliesOnDate: number;
  anomaliesLast7Days: number;
  pharmacyReportsPending: number;
  pharmacyReportsInvalidGeocoding: number;
  unpaidSubscriptionInvoices?: DashboardUnpaidSubscriptionInvoices | null;
}

export interface DashboardSummary {
  date: string;
  generatedAt: string;
  commands: DashboardCommands;
  packages: DashboardPackages;
  tours: DashboardTours;
  tourProgress: DashboardTourProgress[];
  attention: DashboardAttention;
}
