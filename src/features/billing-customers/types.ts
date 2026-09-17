export const BILLING_CUSTOMER_NAME_MAX = 255;

export const BILLING_CUSTOMER_FIELDS = [
  "name",
  "siret",
  "vatNumber",
  "address1",
  "address2",
  "postalCode",
  "city",
  "country",
  "email",
  "phone",
] as const;

export type BillingCustomerField = (typeof BILLING_CUSTOMER_FIELDS)[number];

export interface BillingCustomerInput {
  name: string;
  siret: string | null;
  vatNumber: string | null;
  address1: string | null;
  address2: string | null;
  postalCode: string | null;
  city: string | null;
  country: string | null;
  email: string | null;
  phone: string | null;
}

export interface BillingCustomer extends BillingCustomerInput {
  id: string;
  pharmacyId: string | null;
  missingFields: string[];
  createdAt: string | null;
  updatedAt: string | null;
}
