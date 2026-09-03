import { Minus, Plus } from "lucide-react";
import { brand, mockMap, neutral } from "@/lib/colors";
import { cn } from "@/lib/utils";

export type MockPoint = readonly [number, number];

export interface MockPin {
  x: number;
  y: number;
  color: string;
  order?: number;
  selected?: boolean;
}

export interface MockRoute {
  points: readonly MockPoint[];
  color: string;
}

export interface MockZone {
  d: string;
  color: string;
}

interface MockMapProps {
  pins?: MockPin[];
  routes?: MockRoute[];
  zones?: MockZone[];
  depot?: { x: number; y: number };
  controls?: boolean;
  className?: string;
}

type Road = readonly MockPoint[];

const MINOR_ROADS: readonly Road[] = [
  [
    [92, -10],
    [92, 270],
  ],
  [
    [128, -10],
    [128, 270],
  ],
  [
    [214, 26],
    [214, 270],
  ],
  [
    [288, -10],
    [288, 270],
  ],
  [
    [344, 110],
    [344, 270],
  ],
  [
    [-10, 226],
    [92, 224],
    [128, 222],
    [288, 218],
    [332, 217],
    [410, 214],
  ],
  [
    [-10, 108],
    [128, 104],
    [214, 100],
    [288, 96],
    [410, 89],
  ],
  [
    [128, 104],
    [170, 84],
    [214, 62],
  ],
  [
    [-10, 38],
    [140, 31],
    [214, 26],
  ],
];

const MAJOR_ROADS: readonly Road[] = [
  [
    [-10, 144],
    [92, 141],
    [128, 140],
    [220, 135],
    [288, 132],
    [410, 126],
  ],
  [
    [-10, 79],
    [150, 66],
    [214, 62],
    [268, 56],
    [288, 54],
    [410, 43],
  ],
];

const AVENUE_ROADS: readonly Road[] = [
  [
    [-10, 200],
    [92, 195],
    [160, 190],
    [260, 184],
    [288, 183],
    [410, 176],
  ],
];

const PARKS = [
  { x: 134, y: 230, w: 40, h: 16 },
  { x: 42, y: 86, w: 24, h: 36 },
  { x: 228, y: 30, w: 42, h: 18 },
] as const;

const BUILDINGS: readonly (readonly [number, number, number, number])[] = [
  [72, 148, 14, 10],
  [102, 150, 12, 8],
  [136, 148, 14, 9],
  [158, 146, 10, 11],
  [74, 114, 12, 9],
  [98, 116, 14, 8],
  [136, 116, 12, 9],
  [222, 142, 14, 10],
  [244, 140, 10, 8],
  [298, 140, 12, 9],
  [222, 106, 12, 9],
  [240, 104, 10, 8],
  [298, 104, 12, 8],
  [136, 74, 10, 8],
  [222, 70, 12, 8],
  [98, 204, 12, 9],
  [44, 148, 16, 10],
  [60, 40, 12, 9],
  [100, 38, 14, 8],
];

const WATER = "M318 0 C 330 22 342 36 362 48 C 378 57 390 66 400 76 L 400 0 Z";

const PLACES = [
  { x: 110, y: 172, label: "Rennes", size: 9 },
  { x: 166, y: 46, label: "Betton", size: 7.5 },
  { x: 280, y: 22, label: "Melesse", size: 7.5 },
] as const;

const PIN_PATH = "M8 -12c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z";

const fmt = (value: number) => Math.round(value * 10) / 10;

function linePath(points: Road): string {
  return points
    .map(([x, y], index) => `${index === 0 ? "M" : "L"}${fmt(x)} ${fmt(y)}`)
    .join(" ");
}

function routePath(points: Road, radius = 7): string {
  if (points.length < 2) return "";
  const parts = [`M${fmt(points[0][0])} ${fmt(points[0][1])}`];
  for (let index = 1; index < points.length - 1; index += 1) {
    const [px, py] = points[index - 1];
    const [cx, cy] = points[index];
    const [nx, ny] = points[index + 1];
    const inLen = Math.hypot(cx - px, cy - py);
    const outLen = Math.hypot(nx - cx, ny - cy);
    if (inLen === 0 || outLen === 0) continue;
    const r = Math.min(radius, inLen / 2, outLen / 2);
    const inX = cx - ((cx - px) / inLen) * r;
    const inY = cy - ((cy - py) / inLen) * r;
    const outX = cx + ((nx - cx) / outLen) * r;
    const outY = cy + ((ny - cy) / outLen) * r;
    parts.push(
      `L${fmt(inX)} ${fmt(inY)}`,
      `Q${fmt(cx)} ${fmt(cy)} ${fmt(outX)} ${fmt(outY)}`
    );
  }
  const [lx, ly] = points[points.length - 1];
  parts.push(`L${fmt(lx)} ${fmt(ly)}`);
  return parts.join(" ");
}

interface RouteArrow {
  x: number;
  y: number;
  angle: number;
}

function routeArrows(points: Road, spacing = 62, offset = 34): RouteArrow[] {
  const arrows: RouteArrow[] = [];
  let travelled = 0;
  let next = offset;
  for (let index = 1; index < points.length; index += 1) {
    const [ax, ay] = points[index - 1];
    const [bx, by] = points[index];
    const length = Math.hypot(bx - ax, by - ay);
    if (length === 0) continue;
    const angle = (Math.atan2(by - ay, bx - ax) * 180) / Math.PI;
    while (next <= travelled + length) {
      const along = next - travelled;
      if (along > 8 && length - along > 8) {
        const t = along / length;
        arrows.push({ x: ax + (bx - ax) * t, y: ay + (by - ay) * t, angle });
      }
      next += spacing;
    }
    travelled += length;
  }
  return arrows;
}

function RoadLayer({
  roads,
  width,
  color,
}: {
  roads: readonly Road[];
  width: number;
  color: string;
}) {
  return (
    <>
      {roads.map((road) => (
        <path
          key={linePath(road)}
          d={linePath(road)}
          fill="none"
          stroke={color}
          strokeWidth={width}
          strokeLinecap="round"
        />
      ))}
    </>
  );
}

export function MockMap({
  pins = [],
  routes = [],
  zones = [],
  depot,
  controls = true,
  className,
}: MockMapProps) {
  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{ backgroundColor: mockMap.land }}
    >
      <svg
        viewBox="0 0 400 260"
        preserveAspectRatio="xMidYMid slice"
        className="size-full"
        role="presentation"
      >
        <defs>
          <filter id="mock-pin-shadow" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow
              dx="0"
              dy="1"
              stdDeviation="0.8"
              floodColor="#000000"
              floodOpacity="0.35"
            />
          </filter>
        </defs>

        <rect x="0" y="0" width="400" height="260" fill={mockMap.land} />

        {PARKS.map((park) => (
          <rect
            key={`${park.x}-${park.y}`}
            x={park.x}
            y={park.y}
            width={park.w}
            height={park.h}
            rx="6"
            fill={mockMap.park}
          />
        ))}

        <path d={WATER} fill={mockMap.water} />

        {BUILDINGS.map(([x, y, w, h]) => (
          <rect
            key={`${x}-${y}`}
            x={x}
            y={y}
            width={w}
            height={h}
            rx="1"
            fill={mockMap.building}
          />
        ))}

        <RoadLayer roads={MINOR_ROADS} width={3.6} color={mockMap.roadCasing} />
        <RoadLayer roads={MAJOR_ROADS} width={6} color={mockMap.roadCasing} />
        <RoadLayer roads={AVENUE_ROADS} width={6.6} color={mockMap.avenueCasing} />
        <RoadLayer roads={MINOR_ROADS} width={2.4} color={mockMap.road} />
        <RoadLayer roads={MAJOR_ROADS} width={4.6} color={mockMap.road} />
        <RoadLayer roads={AVENUE_ROADS} width={5.2} color={mockMap.avenue} />

        {PLACES.map((place) => (
          <text
            key={place.label}
            x={place.x}
            y={place.y}
            textAnchor="middle"
            fontSize={place.size}
            fontWeight="600"
            letterSpacing="0.4"
            fill={mockMap.label}
            stroke={mockMap.road}
            strokeWidth="2.4"
            paintOrder="stroke"
          >
            {place.label}
          </text>
        ))}

        {zones.map((zone) => (
          <path
            key={zone.d}
            d={zone.d}
            fill={zone.color}
            fillOpacity="0.12"
            stroke={zone.color}
            strokeOpacity="0.45"
            strokeWidth="1.5"
            strokeDasharray="5 3"
          />
        ))}

        {routes.map((route) => (
          <path
            key={routePath(route.points)}
            d={routePath(route.points)}
            fill="none"
            stroke={route.color}
            strokeOpacity="0.85"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
        {routes.flatMap((route, routeIndex) =>
          routeArrows(route.points).map((arrow, index) => (
            <g
              key={`${routeIndex}-${index}`}
              transform={`translate(${fmt(arrow.x)} ${fmt(arrow.y)}) rotate(${fmt(arrow.angle)})`}
            >
              <path
                d="M-2 -2.4 L2.6 0 L-2 2.4 Z"
                fill={mockMap.road}
                stroke="rgba(0, 0, 0, 0.45)"
                strokeWidth="0.7"
                strokeLinejoin="round"
              />
            </g>
          ))
        )}

        {pins.map((pin) => (
          <g
            key={`${pin.x}-${pin.y}`}
            transform={`translate(${pin.x} ${pin.y}) scale(0.7)`}
            filter="url(#mock-pin-shadow)"
          >
            <path
              d={PIN_PATH}
              fill={pin.selected ? mockMap.selectedPin : pin.color}
              stroke={neutral.white}
              strokeWidth="1.6"
            />
            {pin.order ? (
              <text
                x="0"
                y="-8.7"
                textAnchor="middle"
                fontSize="9.5"
                fontWeight="700"
                fill={neutral.white}
              >
                {pin.order}
              </text>
            ) : (
              <circle cx="0" cy="-12" r="3.2" fill={neutral.white} />
            )}
          </g>
        ))}

        {depot && (
          <g
            transform={`translate(${depot.x} ${depot.y}) scale(0.85)`}
            filter="url(#mock-pin-shadow)"
          >
            <path
              d={PIN_PATH}
              fill={brand[800]}
              stroke={neutral.white}
              strokeWidth="1.6"
            />
            <path
              d="M-3.4 -14.7 H3.4 M-3.4 -12 H3.4 M-3.4 -9.3 H3.4"
              stroke={neutral.white}
              strokeWidth="1.3"
              strokeLinecap="round"
            />
          </g>
        )}
      </svg>

      {controls && (
        <div
          className="absolute right-2 top-2 flex flex-col overflow-hidden rounded-md border shadow-sm"
          style={{
            backgroundColor: neutral.white,
            borderColor: neutral[200],
            color: neutral[700],
          }}
        >
          <span
            className="flex size-6 items-center justify-center border-b"
            style={{ borderColor: neutral[200] }}
          >
            <Plus className="size-3" />
          </span>
          <span className="flex size-6 items-center justify-center">
            <Minus className="size-3" />
          </span>
        </div>
      )}
    </div>
  );
}
