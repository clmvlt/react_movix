export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }

  get errorCode(): string | null {
    if (typeof this.body !== "object" || this.body === null) return null;
    const code = (this.body as { error?: unknown }).error;
    return typeof code === "string" ? code : null;
  }

  get isEmailNotVerified(): boolean {
    return this.errorCode === "EMAIL_NOT_VERIFIED";
  }

  get isNoAccountAccess(): boolean {
    return this.errorCode === "NO_ACCOUNT_ACCESS";
  }

  get isNetworkError(): boolean {
    return this.status === 0 || this.status === 408;
  }

  get isRegistrationTokenInvalid(): boolean {
    return this.errorCode === "REGISTRATION_TOKEN_INVALID";
  }

  get isGoogleEmailUsed(): boolean {
    return this.status === 409 || this.errorCode === "GOOGLE_EMAIL_ALREADY_USED";
  }

  get isPharmacyCipAlreadyUsed(): boolean {
    if (this.errorCode === "PHARMACY_CIP_ALREADY_USED") return true;
    if (this.status !== 409) return false;
    const raw =
      typeof this.body === "string" ? this.body.trim() : this.message.trim();
    return raw === "PHARMACY_CIP_ALREADY_USED";
  }

  get isTermsNotAccepted(): boolean {
    if (this.errorCode === "TERMS_NOT_ACCEPTED") return true;
    const raw =
      typeof this.body === "string" ? this.body.trim() : this.message.trim();
    return raw === "TERMS_NOT_ACCEPTED";
  }

  get isBillingInvalid(): boolean {
    return this.status === 400 && this.errorCode === "BILLING_INVALID";
  }

  get structuredFieldErrors(): Record<string, string> {
    if (typeof this.body !== "object" || this.body === null) return {};
    const items = (this.body as { errors?: unknown }).errors;
    if (!Array.isArray(items)) return {};
    const result: Record<string, string> = {};
    for (const item of items) {
      if (typeof item !== "object" || item === null) continue;
      const { field, message } = item as { field?: unknown; message?: unknown };
      if (typeof field !== "string" || typeof message !== "string") continue;
      if (!result[field]) result[field] = message;
    }
    return result;
  }

  get fieldErrors(): Record<string, string> {
    if (this.status !== 400) return {};
    const raw =
      typeof this.body === "string"
        ? this.body
        : typeof this.message === "string"
          ? this.message
          : "";
    const result: Record<string, string> = {};
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const spaceIndex = trimmed.indexOf(" ");
      if (spaceIndex <= 0) continue;
      const field = trimmed.slice(0, spaceIndex);
      const message = trimmed.slice(spaceIndex + 1);
      if (field && !result[field]) result[field] = message;
    }
    return result;
  }
}

export function isNetworkError(error: unknown): boolean {
  if (error instanceof ApiError) return error.isNetworkError;
  return error instanceof TypeError;
}

export function apiErrorText(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null;
  const raw =
    typeof error.body === "string" ? error.body.trim() : error.message.trim();
  if (!raw || /^HTTP \d+$/.test(raw)) return null;
  return raw;
}
