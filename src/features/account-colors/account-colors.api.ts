import { http } from "@/lib/http";
import type {
  AccountColor,
  AccountColorCreateInput,
  AccountColorOrderEntry,
  AccountColorUpdateInput,
} from "./types";

const RESOURCE = "/account/colors";

export const accountColorsApi = {
  list: () => http.get<AccountColor[]>(RESOURCE),
  create: (input: AccountColorCreateInput) =>
    http.post<AccountColor>(RESOURCE, input),
  update: (id: string, input: AccountColorUpdateInput) =>
    http.put<AccountColor>(`${RESOURCE}/${id}`, input),
  remove: (id: string) => http.delete<void>(`${RESOURCE}/${id}`),
  reorder: async (entries: AccountColorOrderEntry[]) => {
    for (const entry of entries) {
      await http.put<AccountColor>(`${RESOURCE}/${entry.id}`, {
        displayOrder: entry.displayOrder,
      });
    }
  },
};
