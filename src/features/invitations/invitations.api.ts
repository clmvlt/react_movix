import { http } from "@/lib/http";
import type { AccountMembership } from "@/features/auth/types";
import type {
  Invitation,
  InvitationCreateInput,
  InvitationPreview,
  JoinAccountInput,
} from "./types";

const RESOURCE = "/account";

export const invitationsApi = {
  list: () => http.get<Invitation[]>(`${RESOURCE}/invitations`),

  create: (input: InvitationCreateInput) =>
    http.post<Invitation>(`${RESOURCE}/invitations`, input),

  revoke: (id: string) =>
    http.delete<void>(`${RESOURCE}/invitations/${encodeURIComponent(id)}`),

  join: (input: JoinAccountInput) =>
    http.post<AccountMembership>(`${RESOURCE}/join`, input),

  preview: (code: string) =>
    http.get<InvitationPreview>(
      `${RESOURCE}/join/${encodeURIComponent(code)}`,
      { auth: false }
    ),
};
