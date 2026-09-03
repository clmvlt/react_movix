export interface StatsFilters {
  startDate: string;
  endDate: string;
  pharmacyCip?: string | null;
  tourId?: string | null;
  profilId?: string | null;
}

export interface StatsOverview {
  totalCommands: number;
  deliveredCommands: number;
  notDeliveredCommands: number;
  loadedCommands: number;
  pendingCommands: number;
  missingCommands: number;
  deliveryRate: number;
  notDeliveryRate: number;
  totalPackages: number;
  deliveredPackages: number;
  notDeliveredPackages: number;
  packageDeliveryRate: number;
  totalWeight: number;
  avgPackagesPerCommand: number;
  totalTours: number;
  avgCommandsPerTour: number;
}

export interface StatsDailyItem {
  date: string;
  dayOfWeek: number;
  totalCommands: number;
  deliveredCommands: number;
  notDeliveredCommands: number;
  totalPackages: number;
  deliveredPackages: number;
  totalTours: number;
  totalWeight: number;
  deliveryRate: number;
}

export interface StatsDaily {
  days: StatsDailyItem[];
}

export const STATS_DAILY_MAX_DAYS = 92;

export interface StatsPharmacyItem {
  cip: string;
  name: string | null;
  city: string | null;
  totalCommands: number;
  deliveredCommands: number;
  notDeliveredCommands: number;
  totalPackages: number;
  deliveredPackages: number;
  deliveryRate: number;
  totalWeight: number;
}

export interface StatsByPharmacy {
  pharmacies: StatsPharmacyItem[];
}

export interface PharmacyStatsParams {
  startDate: string;
  endDate: string;
  pharmacyCip: string;
  profilId: string;
}

export interface PharmacyTotals {
  pharmacyCount: number;
  totalCommands: number;
  deliveredCommands: number;
  notDeliveredCommands: number;
  totalPackages: number;
  deliveredPackages: number;
  totalWeight: number;
  deliveryRate: number | null;
  isLocal: boolean;
}
