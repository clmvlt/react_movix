export const profileKeys = {
  all: ["profiles"] as const,
  lists: () => [...profileKeys.all, "list"] as const,
  details: () => [...profileKeys.all, "detail"] as const,
  detail: (id: string) => [...profileKeys.details(), id] as const,
  emailAvailability: (email: string) =>
    [...profileKeys.all, "email-availability", email] as const,
  verifyEmail: (token: string) =>
    [...profileKeys.all, "verify-email", token] as const,
};
