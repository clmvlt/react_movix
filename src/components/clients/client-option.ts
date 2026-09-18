import { clientLabel, type Client } from "@/features/clients";

export interface ClientOption {
  id: string;
  name: string;
}

export function clientOption(client: Client): ClientOption {
  return { id: client.id, name: clientLabel(client) };
}
