import { isConsentAllowed } from "./consent";

const GSI_SRC = "https://accounts.google.com/gsi/client";

export interface GoogleCredentialResponse {
  credential: string;
  select_by?: string;
}

export interface GoogleButtonOptions {
  type?: "standard" | "icon";
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  shape?: "rectangular" | "pill" | "circle" | "square";
  logo_alignment?: "left" | "center";
  width?: number;
  locale?: string;
}

export interface GoogleAccountsId {
  initialize(options: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
  }): void;
  renderButton(parent: HTMLElement, options: GoogleButtonOptions): void;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: GoogleAccountsId;
      };
    };
  }
}

export class GoogleIdentityBlockedError extends Error {
  constructor() {
    super("Google Identity Services blocked by cookie consent");
    this.name = "GoogleIdentityBlockedError";
  }
}

let loader: Promise<GoogleAccountsId> | null = null;

// The GIS script is only injected once the "google" consent category is
// allowed. Withdrawing that consent later does not unload the script: it stays
// in memory (and window.google stays defined) until the next full page load.
// Callers must therefore gate their own usage on isConsentAllowed("google")
// rather than on the presence of window.google.
export function loadGoogleIdentity(): Promise<GoogleAccountsId> {
  if (!isConsentAllowed("google")) {
    return Promise.reject(new GoogleIdentityBlockedError());
  }

  const existing = window.google?.accounts?.id;
  if (existing) return Promise.resolve(existing);

  loader ??= new Promise<GoogleAccountsId>((resolve, reject) => {
    const fail = (script: HTMLScriptElement) => {
      script.remove();
      loader = null;
      reject(new Error("Google Identity Services unavailable"));
    };
    const script = document.createElement("script");
    script.src = GSI_SRC;
    script.async = true;
    script.onload = () => {
      const api = window.google?.accounts?.id;
      if (api) resolve(api);
      else fail(script);
    };
    script.onerror = () => fail(script);
    document.head.appendChild(script);
  });

  return loader;
}
