import { Suspense, lazy, useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { hasSession } from "@/lib/auth";
import { clearAuthRedirect, peekAuthRedirect } from "@/lib/auth-redirect";
import { useAuth } from "./auth-context";
import { FullPageSpinner } from "@/components/full-page-spinner";
import { TermsGate } from "@/components/auth/terms-gate";

const NoCompanyPage = lazy(() =>
  import("@/pages/no-company-page").then((m) => ({ default: m.NoCompanyPage }))
);

export function ProtectedRoute() {
  const { user, accounts, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <FullPageSpinner />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (Boolean(user?.userId) && accounts.length === 0) {
    return (
      <>
        <Suspense fallback={<FullPageSpinner />}>
          <NoCompanyPage />
        </Suspense>
        <TermsGate />
      </>
    );
  }

  return (
    <>
      <Outlet />
      <TermsGate />
    </>
  );
}

export function PublicOnlyRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading && hasSession()) return <FullPageSpinner />;

  if (isAuthenticated) {
    return <AuthenticatedRedirect />;
  }

  return <Outlet />;
}

function AuthenticatedRedirect() {
  const target = peekAuthRedirect() ?? "/app";

  useEffect(() => {
    clearAuthRedirect();
  }, []);

  return <Navigate to={target} replace />;
}
