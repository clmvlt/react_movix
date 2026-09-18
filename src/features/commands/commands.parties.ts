import { clientLabel, type Client } from "@/features/clients/types";
import type { CommandParty } from "./types";

export function partyLabel(party: CommandParty | null | undefined): string {
  if (!party) return "";
  const name = party.name?.trim();
  if (name) return name;
  const person = [party.firstName, party.lastName]
    .map((part) => part?.trim() ?? "")
    .filter(Boolean)
    .join(" ");
  if (person) return person;
  return party.cip?.trim() ?? "";
}

export function partyPlace(party: CommandParty | null | undefined): string {
  if (!party) return "";
  return [party.postalCode, party.city]
    .map((part) => part?.trim() ?? "")
    .filter(Boolean)
    .join(" ");
}

export function partyAddressLines(
  party: CommandParty | null | undefined
): string[] {
  if (!party) return [];
  return [party.address1, party.address2, party.address3, partyPlace(party)]
    .map((line) => line?.trim() ?? "")
    .filter(Boolean);
}

export function partyFromClient(
  client: Client | null | undefined
): CommandParty | null {
  if (!client) return null;
  return {
    linked: true,
    clientId: client.id,
    clientType: client.type,
    cip: client.type === "PHARMACY" ? client.cip : null,
    name: clientLabel(client) || null,
    firstName: client.firstName,
    lastName: client.lastName,
    address1: client.address1,
    address2: client.address2,
    address3: client.address3,
    postalCode: client.postalCode,
    city: client.city,
    country: client.country,
    phone: client.phone,
    email: client.email,
    latitude: client.latitude,
    longitude: client.longitude,
  };
}

interface WithParties {
  recipient?: CommandParty | null;
  client?: Client | null;
}

export function commandRecipient(
  command: WithParties | null | undefined
): CommandParty | null {
  if (!command) return null;
  return command.recipient ?? partyFromClient(command.client);
}
