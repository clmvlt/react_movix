import type { ClientRef } from "@/features/clients/types";

export interface ClientLinkPatch {
  clientId?: string;
  clearClient?: boolean;
}

export function clientLinkPatch(
  current: ClientRef | null | undefined,
  next: ClientRef | null
): ClientLinkPatch {
  const currentId = current?.id ?? null;
  const nextId = next?.id ?? null;
  if (currentId === nextId) return {};
  if (nextId) return { clientId: nextId };
  return { clearClient: true };
}
