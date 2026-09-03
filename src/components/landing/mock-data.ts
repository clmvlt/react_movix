import { categoryPalette } from "@/lib/colors";
import type {
  MockPin,
  MockPoint,
  MockRoute,
  MockZone,
} from "@/components/landing/mock-map";

export const TOUR_COLORS = {
  north: categoryPalette[0],
  west: categoryPalette[2],
  south: categoryPalette[4],
  east: categoryPalette[7],
} as const;

export const DEPOT = { x: 92, y: 195 };

export const ROUTE_NORTH: MockPoint[] = [
  [92, 195],
  [92, 141],
  [128, 140],
  [128, 104],
  [170, 84],
  [214, 62],
  [268, 56],
];

export const ROUTE_NORTH_LOOP: MockPoint[] = [
  ...ROUTE_NORTH,
  [288, 54],
  [288, 96],
  [288, 132],
  [288, 183],
  [260, 184],
  [160, 190],
  [92, 195],
];

export const ROUTE_EAST: MockPoint[] = [
  [92, 195],
  [160, 190],
  [260, 184],
  [288, 183],
  [288, 132],
  [288, 96],
];

export const ROUTE_SOUTH: MockPoint[] = [
  [92, 195],
  [92, 224],
  [128, 222],
  [288, 218],
  [332, 217],
];

export const ZONES: MockZone[] = [
  { d: "M68 158 L 96 74 L 240 30 L 296 64 L 150 160 Z", color: TOUR_COLORS.north },
  { d: "M140 210 L 310 196 L 312 82 L 250 68 Z", color: TOUR_COLORS.east },
  { d: "M84 244 L 88 206 L 372 200 L 378 238 Z", color: TOUR_COLORS.south },
];

export const SCATTER_PINS: MockPin[] = [
  { x: 110, y: 140, color: TOUR_COLORS.north },
  { x: 128, y: 104, color: TOUR_COLORS.north },
  { x: 170, y: 84, color: TOUR_COLORS.north },
  { x: 268, y: 56, color: TOUR_COLORS.north },
  { x: 160, y: 190, color: TOUR_COLORS.east },
  { x: 260, y: 184, color: TOUR_COLORS.east },
  { x: 288, y: 132, color: TOUR_COLORS.east },
  { x: 288, y: 96, color: TOUR_COLORS.east },
  { x: 110, y: 223, color: TOUR_COLORS.south },
  { x: 200, y: 220, color: TOUR_COLORS.south },
  { x: 288, y: 218, color: TOUR_COLORS.south },
  { x: 332, y: 217, color: TOUR_COLORS.south },
];

export const ORDERED_PINS: MockPin[] = [
  { x: 110, y: 140, color: TOUR_COLORS.north, order: 1 },
  { x: 128, y: 104, color: TOUR_COLORS.north, order: 2 },
  { x: 170, y: 84, color: TOUR_COLORS.north, order: 3, selected: true },
  { x: 268, y: 56, color: TOUR_COLORS.north, order: 4 },
];

export const ALL_ROUTES: MockRoute[] = [
  { points: ROUTE_NORTH, color: TOUR_COLORS.north },
  { points: ROUTE_EAST, color: TOUR_COLORS.east },
  { points: ROUTE_SOUTH, color: TOUR_COLORS.south },
];

export interface MockCommand {
  name: string;
  location: string;
  packages: number;
  statusKey: "delivered" | "loaded" | "toDeliver" | "preparing";
  tourColor?: string;
  selected?: boolean;
  isNew?: boolean;
}

export const MOCK_COMMANDS: MockCommand[] = [
  {
    name: "Pharmacie du Marché",
    location: "35000 Rennes",
    packages: 4,
    statusKey: "loaded",
    tourColor: TOUR_COLORS.north,
    selected: true,
  },
  {
    name: "Pharmacie Saint-Michel",
    location: "35700 Rennes",
    packages: 2,
    statusKey: "loaded",
    tourColor: TOUR_COLORS.north,
    selected: true,
  },
  {
    name: "Pharmacie des Halles",
    location: "35510 Cesson-Sévigné",
    packages: 6,
    statusKey: "toDeliver",
    tourColor: TOUR_COLORS.east,
  },
  {
    name: "Pharmacie de la Gare",
    location: "35770 Vern-sur-Seiche",
    packages: 1,
    statusKey: "delivered",
    tourColor: TOUR_COLORS.east,
  },
  {
    name: "Pharmacie Centrale",
    location: "35400 Saint-Malo",
    packages: 9,
    statusKey: "preparing",
    isNew: true,
  },
  {
    name: "Pharmacie du Port",
    location: "56000 Vannes",
    packages: 3,
    statusKey: "toDeliver",
    tourColor: TOUR_COLORS.south,
  },
  {
    name: "Pharmacie des Écoles",
    location: "22000 Saint-Brieuc",
    packages: 5,
    statusKey: "delivered",
    tourColor: TOUR_COLORS.south,
  },
  {
    name: "Pharmacie de l'Océan",
    location: "29200 Brest",
    packages: 2,
    statusKey: "toDeliver",
    tourColor: TOUR_COLORS.south,
  },
  {
    name: "Pharmacie des Remparts",
    location: "35500 Vitré",
    packages: 7,
    statusKey: "loaded",
    tourColor: TOUR_COLORS.east,
  },
  {
    name: "Pharmacie du Golfe",
    location: "56400 Auray",
    packages: 3,
    statusKey: "delivered",
    tourColor: TOUR_COLORS.south,
  },
  {
    name: "Pharmacie Kerlann",
    location: "29000 Quimper",
    packages: 2,
    statusKey: "toDeliver",
    tourColor: TOUR_COLORS.north,
  },
  {
    name: "Pharmacie de la Place",
    location: "56100 Lorient",
    packages: 8,
    statusKey: "preparing",
  },
  {
    name: "Pharmacie des Chênes",
    location: "35300 Fougères",
    packages: 1,
    statusKey: "toDeliver",
    tourColor: TOUR_COLORS.east,
  },
];

export interface MockStop {
  order: number;
  name: string;
  city: string;
  eta: string;
  window?: {
    start?: string;
    end?: string;
    tone: "success" | "warning";
  };
  selected?: boolean;
}

export const MOCK_STOPS: MockStop[] = [
  {
    order: 1,
    name: "Pharmacie du Marché",
    city: "Rennes",
    eta: "08:24",
  },
  {
    order: 2,
    name: "Pharmacie des Lices",
    city: "Rennes",
    eta: "08:51",
    window: { end: "12:00", tone: "success" },
  },
  {
    order: 3,
    name: "Pharmacie du Centre",
    city: "Betton",
    eta: "09:18",
    window: { start: "09:30", tone: "warning" },
    selected: true,
  },
  {
    order: 4,
    name: "Pharmacie de la Gare",
    city: "Melesse",
    eta: "09:47",
  },
];
