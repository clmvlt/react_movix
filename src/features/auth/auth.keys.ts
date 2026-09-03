export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
  confirmRegistration: (token: string) =>
    [...authKeys.all, "confirm-registration", token] as const,
};
