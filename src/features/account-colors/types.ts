export interface AccountColor {
  id: string;
  name: string | null;
  color: string;
  displayOrder: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AccountColorCreateInput {
  color: string;
  name?: string;
  displayOrder?: number;
}

export interface AccountColorUpdateInput {
  color?: string;
  name?: string;
  displayOrder?: number;
}

export interface AccountColorOrderEntry {
  id: string;
  displayOrder: number;
}

export function sortAccountColors(colors: AccountColor[]): AccountColor[] {
  return [...colors].sort((a, b) => {
    if (a.displayOrder != null && b.displayOrder != null) {
      return a.displayOrder - b.displayOrder;
    }
    if (a.displayOrder != null) return -1;
    if (b.displayOrder != null) return 1;
    return a.createdAt.localeCompare(b.createdAt);
  });
}
