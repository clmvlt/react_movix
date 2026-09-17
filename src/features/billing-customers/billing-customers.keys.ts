export const billingCustomerKeys = {
  all: ["billing-customers"] as const,
  lists: () => [...billingCustomerKeys.all, "list"] as const,
  list: (search: string) => [...billingCustomerKeys.lists(), search] as const,
  details: () => [...billingCustomerKeys.all, "detail"] as const,
  detail: (id: string) => [...billingCustomerKeys.details(), id] as const,
};
