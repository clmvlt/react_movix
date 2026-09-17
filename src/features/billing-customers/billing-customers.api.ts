import { http } from "@/lib/http";
import type { BillingCustomer, BillingCustomerInput } from "./types";

const RESOURCE = "/billing/customers";

function pathId(id: string): string {
  return encodeURIComponent(id.trim());
}

export const billingCustomersApi = {
  list: (search?: string) =>
    http.get<BillingCustomer[]>(RESOURCE, {
      query: { search: search?.trim() || undefined },
    }),

  get: (id: string) => http.get<BillingCustomer>(`${RESOURCE}/${pathId(id)}`),

  create: (input: BillingCustomerInput) =>
    http.post<BillingCustomer>(RESOURCE, input),

  update: (id: string, input: BillingCustomerInput) =>
    http.put<BillingCustomer>(`${RESOURCE}/${pathId(id)}`, input),

  remove: (id: string) => http.delete<void>(`${RESOURCE}/${pathId(id)}`),

  fromPharmacy: (pharmacyId: string) =>
    http.post<BillingCustomer>(
      `${RESOURCE}/from-pharmacy/${pathId(pharmacyId)}`
    ),
};
