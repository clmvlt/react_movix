import { http } from "@/lib/http";
import { ApiError } from "@/lib/api-error";
import type { Account } from "@/features/auth/types";
import type {
  AccountBilling,
  AccountBillingInput,
  AccountDetail,
  AccountUpdateInput,
  EmailTestResult,
} from "./types";

const RESOURCE = "/account";
const EMAIL_TEST = "/email/test";
const EMAIL_TEST_TIMEOUT = 30_000;

function isEmailTestResult(body: unknown): body is EmailTestResult {
  if (typeof body !== "object" || body === null) return false;
  const candidate = body as Partial<EmailTestResult>;
  return (
    (candidate.status === "SUCCESS" || candidate.status === "ERROR") &&
    typeof candidate.message === "string"
  );
}

export const accountApi = {
  details: () => http.get<AccountDetail>(`${RESOURCE}/details`),

  listAll: () => http.get<Account[]>(`${RESOURCE}/all`),

  update: (input: AccountUpdateInput) =>
    http.put<Account>(`${RESOURCE}/update`, input),

  billing: () => http.get<AccountBilling>(`${RESOURCE}/billing`),

  updateBilling: (input: AccountBillingInput) =>
    http.put<AccountBilling>(`${RESOURCE}/billing`, input),

  testEmail: async (): Promise<EmailTestResult> => {
    try {
      return await http.post<EmailTestResult>(EMAIL_TEST, undefined, {
        timeoutMs: EMAIL_TEST_TIMEOUT,
      });
    } catch (error) {
      if (error instanceof ApiError && isEmailTestResult(error.body)) {
        return error.body;
      }
      throw error;
    }
  },
};
