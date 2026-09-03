import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "warning" | "destructive";

interface ToastItem {
  id: number;
  variant: ToastVariant;
  message: string;
  closing: boolean;
}

interface ToastApi {
  success: (message: string) => void;
  warning: (message: string) => void;
  error: (message: string) => void;
}

const TOAST_DURATIONS: Record<ToastVariant, number> = {
  success: 4000,
  warning: 6000,
  destructive: 8000,
};

const MAX_TOASTS = 3;
const EXIT_DURATION = 200;

const TOAST_STYLES: Record<ToastVariant, { card: string; icon: string }> = {
  success: {
    card: "border-status-success-strong/25 bg-status-success-bg text-status-success-text",
    icon: "text-status-success-strong",
  },
  warning: {
    card: "border-status-warning-strong/25 bg-status-warning-bg text-status-warning-text",
    icon: "text-status-warning-strong",
  },
  destructive: {
    card: "border-status-danger-strong/25 bg-status-danger-bg text-status-danger-text",
    icon: "text-status-danger-strong",
  },
};

const ToastContext = createContext<ToastApi | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);
  const timersRef = useRef(new Map<number, number>());

  const removeToast = useCallback((id: number) => {
    const timer = timersRef.current.get(id);
    if (timer !== undefined) {
      window.clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((current) =>
      current.map((toast) =>
        toast.id === id ? { ...toast, closing: true } : toast
      )
    );
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, EXIT_DURATION);
  }, []);

  const scheduleClose = useCallback(
    (id: number, variant: ToastVariant) => {
      const timer = window.setTimeout(
        () => removeToast(id),
        TOAST_DURATIONS[variant]
      );
      timersRef.current.set(id, timer);
    },
    [removeToast]
  );

  const pauseClose = useCallback((id: number) => {
    const timer = timersRef.current.get(id);
    if (timer !== undefined) {
      window.clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const addToast = useCallback(
    (variant: ToastVariant, message: string) => {
      idRef.current += 1;
      const id = idRef.current;
      setToasts((current) => {
        const next = [...current, { id, variant, message, closing: false }];
        const active = next.filter((toast) => !toast.closing);
        if (active.length > MAX_TOASTS) {
          const oldest = active[0];
          const timer = timersRef.current.get(oldest.id);
          if (timer !== undefined) {
            window.clearTimeout(timer);
            timersRef.current.delete(oldest.id);
          }
          return next.filter((toast) => toast.id !== oldest.id);
        }
        return next;
      });
      scheduleClose(id, variant);
    },
    [scheduleClose]
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (message) => addToast("success", message),
      warning: (message) => addToast("warning", message),
      error: (message) => addToast("destructive", message),
    }),
    [addToast]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {toasts.length > 0 && (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              role={toast.variant === "destructive" ? "alert" : "status"}
              aria-live={toast.variant === "destructive" ? undefined : "polite"}
              className={cn(
                "pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-xl border py-2.5 pl-4 pr-1.5 shadow-lg",
                TOAST_STYLES[toast.variant].card,
                toast.closing
                  ? "duration-200 ease-in animate-out fade-out-0 zoom-out-95 slide-out-to-bottom-2 fill-mode-forwards"
                  : "duration-300 ease-out animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4"
              )}
              onMouseEnter={() => pauseClose(toast.id)}
              onMouseLeave={() => {
                if (!toast.closing) scheduleClose(toast.id, toast.variant);
              }}
            >
              {toast.variant === "success" ? (
                <CheckCircle2
                  className={cn(
                    "size-5 shrink-0",
                    TOAST_STYLES[toast.variant].icon
                  )}
                />
              ) : (
                <AlertTriangle
                  className={cn(
                    "size-5 shrink-0",
                    TOAST_STYLES[toast.variant].icon
                  )}
                />
              )}
              <p className="min-w-0 flex-1 py-0.5 text-sm leading-snug">
                {toast.message}
              </p>
              <button
                type="button"
                className="flex size-10 shrink-0 items-center justify-center rounded-lg text-current opacity-60 transition-[background-color,opacity] hover:bg-current/10 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/40 active:bg-current/15 lg:size-8"
                onClick={() => removeToast(toast.id)}
                aria-label={t("common.close")}
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
