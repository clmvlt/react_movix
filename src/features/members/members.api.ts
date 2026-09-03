import { http } from "@/lib/http";
import type { AccountMembership, Profil } from "@/features/auth/types";
import type { ProfilUpdateInput } from "@/features/profiles/types";
import type { AccountMemberAddInput } from "./types";

const base = (accountId: string) =>
  `/account/${encodeURIComponent(accountId)}/members`;

export const membersApi = {
  list: (accountId: string) => http.get<Profil[]>(base(accountId)),

  add: (accountId: string, input: AccountMemberAddInput) =>
    http.post<AccountMembership>(base(accountId), input),

  update: (accountId: string, profilId: string, input: ProfilUpdateInput) =>
    http.put<void>(
      `${base(accountId)}/${encodeURIComponent(profilId)}`,
      input
    ),

  remove: (accountId: string, profilId: string) =>
    http.delete<void>(`${base(accountId)}/${encodeURIComponent(profilId)}`),
};
