export const invitationKeys = {
  all: ["invitations"] as const,
  lists: () => [...invitationKeys.all, "list"] as const,
  preview: (code: string) =>
    [...invitationKeys.all, "preview", code] as const,
};
