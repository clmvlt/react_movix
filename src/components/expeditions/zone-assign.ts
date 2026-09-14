import { normalizeZoneId } from "./expedition-filters";

export interface ZoneAssignCommand {
  id: string;
  pharmacy?: { zone?: { id: string; name: string } | null } | null;
  tour?: { id: string } | null;
}

export interface ZoneAssignTour {
  id: string;
  name: string;
  color?: string;
  zone?: { id: string; name: string } | null;
}

export interface ZoneAssignGroup {
  zoneId: string;
  zoneName: string;
  commands: ZoneAssignCommand[];
  tours: ZoneAssignTour[];
}

export interface ZoneAssignPlan {
  groups: ZoneAssignGroup[];
  withoutZone: ZoneAssignCommand[];
  zonedTours: number;
}

export interface ZoneAssignTarget {
  pending: ZoneAssignCommand[];
  already: number;
  moved: number;
}

export function planZoneAssignment(
  commands: ZoneAssignCommand[],
  tours: ZoneAssignTour[]
): ZoneAssignPlan {
  const toursByZone = new Map<string, ZoneAssignTour[]>();
  for (const tour of tours) {
    if (!tour.zone?.id) continue;
    const key = normalizeZoneId(tour.zone.id);
    toursByZone.set(key, [...(toursByZone.get(key) ?? []), tour]);
  }

  const groups = new Map<string, ZoneAssignGroup>();
  const withoutZone: ZoneAssignCommand[] = [];
  for (const command of commands) {
    const zone = command.pharmacy?.zone;
    if (!zone?.id) {
      withoutZone.push(command);
      continue;
    }
    const key = normalizeZoneId(zone.id);
    const group = groups.get(key);
    if (group) {
      group.commands.push(command);
    } else {
      groups.set(key, {
        zoneId: key,
        zoneName: zone.name,
        commands: [command],
        tours: [...(toursByZone.get(key) ?? [])].sort((a, b) =>
          a.name.localeCompare(b.name)
        ),
      });
    }
  }

  return {
    groups: Array.from(groups.values()).sort((a, b) =>
      a.zoneName.localeCompare(b.zoneName)
    ),
    withoutZone,
    zonedTours: Array.from(toursByZone.values()).reduce(
      (sum, list) => sum + list.length,
      0
    ),
  };
}

export function defaultZoneTarget(group: ZoneAssignGroup): string | null {
  return group.tours.length === 1 ? group.tours[0].id : null;
}

export function zoneTargetOf(
  group: ZoneAssignGroup,
  tourId: string | null
): ZoneAssignTarget {
  if (!tourId) return { pending: [], already: 0, moved: 0 };
  const pending = group.commands.filter(
    (command) => command.tour?.id !== tourId
  );
  return {
    pending,
    already: group.commands.length - pending.length,
    moved: pending.filter((command) => command.tour != null).length,
  };
}
