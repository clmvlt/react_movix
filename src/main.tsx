import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { initTheme } from "@/lib/theme";
import { queryClient } from "@/lib/query-client";
import { config } from "@/lib/config";
import { AuthProvider } from "@/app/auth-context";
import { NotificationsProvider } from "@/app/notifications-context";
import { WorkingDateProvider } from "@/app/working-date-context";
import { ToastProvider } from "@/app/toast-context";
import { PdfPreviewProvider } from "@/app/pdf-preview-context";
import App from "./App";
import "@/i18n";
import "./index.css";

const ReactQueryDevtools = config.isDev
  ? lazy(() =>
      import("@tanstack/react-query-devtools").then((module) => ({
        default: module.ReactQueryDevtools,
      }))
    )
  : null;

initTheme();

window.addEventListener("vite:preloadError", (event) => {
  const key = "movix.preloadReload";
  if (sessionStorage.getItem(key) === window.location.href) return;
  sessionStorage.setItem(key, window.location.href);
  event.preventDefault();
  window.location.reload();
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <NotificationsProvider>
            <WorkingDateProvider>
              <ToastProvider>
                <PdfPreviewProvider>
                  <App />
                </PdfPreviewProvider>
              </ToastProvider>
            </WorkingDateProvider>
          </NotificationsProvider>
        </AuthProvider>
      </BrowserRouter>
      {ReactQueryDevtools && (
        <Suspense fallback={null}>
          <ReactQueryDevtools initialIsOpen={false} />
        </Suspense>
      )}
    </QueryClientProvider>
  </StrictMode>
);
