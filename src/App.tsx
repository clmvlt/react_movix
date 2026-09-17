import { Suspense, lazy, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { ProtectedRoute, PublicOnlyRoute } from "@/app/protected-route";
import { AuthLayout } from "@/layouts/auth-layout";
import { AppLayout } from "@/layouts/app-layout";
import { FullPageSpinner, InlineSpinner } from "@/components/full-page-spinner";
import { UpdateBanner } from "@/components/update-banner";
import { ConsentBanner } from "@/components/consent/consent-banner";
import { LandingPage } from "@/pages/landing-page";
import { LoginPage } from "@/pages/login-page";
import { RegisterPage } from "@/pages/register-page";
import { JoinPage } from "@/pages/join-page";
import { ForgotPasswordPage } from "@/pages/forgot-password-page";
import { ResetPasswordPage } from "@/pages/reset-password-page";
import { VerifyEmailPage } from "@/pages/verify-email-page";
import { ConfirmRegistrationPage } from "@/pages/confirm-registration-page";
import { NotFoundPage } from "@/pages/not-found-page";
import { config } from "@/lib/config";

const importDashboard = () => import("@/pages/dashboard-page");
const importProfiles = () => import("@/pages/profiles-page");
const importNotifications = () => import("@/pages/notifications-page");
const importExpeditions = () => import("@/pages/expeditions-page");
const importTours = () => import("@/pages/tours-page");
const importTourOrder = () => import("@/pages/tour-order-page");
const importTourConfigs = () => import("@/pages/tour-configs-page");
const importTodos = () => import("@/pages/todos-page");
const importZones = () => import("@/pages/zones-page");
const importAccount = () => import("@/pages/account-page");
const importSettings = () => import("@/pages/settings-page");
const importExports = () => import("@/pages/exports-page");
const importPharmacies = () => import("@/pages/pharmacies-page");
const importPharmacyDetail = () => import("@/pages/pharmacy-detail-page");
const importPharmacyCreate = () => import("@/pages/pharmacy-create-page");
const importPharmacyReports = () => import("@/pages/pharmacy-reports-page");
const importCommands = () => import("@/pages/commands-page");
const importCommandCreate = () => import("@/pages/command-create-page");
const importCommandDetail = () => import("@/pages/command-detail-page");
const importSouffrance = () => import("@/pages/souffrance-page");
const importAnomalies = () => import("@/pages/anomalies-page");
const importAnomalyDetail = () => import("@/pages/anomaly-detail-page");
const importApiTokens = () => import("@/pages/api-tokens-page");
const importSubscriptionInvoices = () => import("@/pages/subscription-invoices-page");
const importMobileApp = () => import("@/pages/mobile-app-page");
const importDownload = () => import("@/pages/download-page");
const importHyperadmin = () => import("@/pages/hyperadmin-page");
const importHyperCompanyCreate = () =>
  import("@/pages/hyper-company-create-page");
const importHyperCompanyEdit = () => import("@/pages/hyper-company-edit-page");
const importConfirmAccountDeletion = () =>
  import("@/pages/confirm-account-deletion-page");
const importLegalTerms = () => import("@/pages/legal/terms-page");
const importLegalPrivacy = () => import("@/pages/legal/privacy-page");
const importLegalCookies = () => import("@/pages/legal/cookies-page");

const DashboardPage = lazy(() =>
  importDashboard().then((m) => ({ default: m.DashboardPage }))
);

const ProfilesPage = lazy(() =>
  importProfiles().then((m) => ({ default: m.ProfilesPage }))
);

const NotificationsPage = lazy(() =>
  importNotifications().then((m) => ({ default: m.NotificationsPage }))
);

const ExpeditionsPage = lazy(() =>
  importExpeditions().then((m) => ({ default: m.ExpeditionsPage }))
);

const ToursPage = lazy(() =>
  importTours().then((m) => ({ default: m.ToursPage }))
);

const TourOrderPage = lazy(() =>
  importTourOrder().then((m) => ({ default: m.TourOrderPage }))
);

const TourConfigsPage = lazy(() =>
  importTourConfigs().then((m) => ({ default: m.TourConfigsPage }))
);

const TodosPage = lazy(() =>
  importTodos().then((m) => ({ default: m.TodosPage }))
);

const ZonesPage = lazy(() =>
  importZones().then((m) => ({ default: m.ZonesPage }))
);

const AccountPage = lazy(() =>
  importAccount().then((m) => ({ default: m.AccountPage }))
);

const SettingsPage = lazy(() =>
  importSettings().then((m) => ({ default: m.SettingsPage }))
);

const ExportsPage = lazy(() =>
  importExports().then((m) => ({ default: m.ExportsPage }))
);

const PharmaciesPage = lazy(() =>
  importPharmacies().then((m) => ({ default: m.PharmaciesPage }))
);

const PharmacyDetailPage = lazy(() =>
  importPharmacyDetail().then((m) => ({ default: m.PharmacyDetailPage }))
);
const PharmacyCreatePage = lazy(() =>
  importPharmacyCreate().then((m) => ({ default: m.PharmacyCreatePage }))
);

const PharmacyReportsPage = lazy(() =>
  importPharmacyReports().then((m) => ({ default: m.PharmacyReportsPage }))
);

const CommandsPage = lazy(() =>
  importCommands().then((m) => ({ default: m.CommandsPage }))
);

const CommandCreatePage = lazy(() =>
  importCommandCreate().then((m) => ({ default: m.CommandCreatePage }))
);

const CommandDetailPage = lazy(() =>
  importCommandDetail().then((m) => ({ default: m.CommandDetailPage }))
);

const SouffrancePage = lazy(() =>
  importSouffrance().then((m) => ({ default: m.SouffrancePage }))
);

const AnomaliesPage = lazy(() =>
  importAnomalies().then((m) => ({ default: m.AnomaliesPage }))
);

const AnomalyDetailPage = lazy(() =>
  importAnomalyDetail().then((m) => ({ default: m.AnomalyDetailPage }))
);

const ApiTokensPage = lazy(() =>
  importApiTokens().then((m) => ({ default: m.ApiTokensPage }))
);

const SubscriptionInvoicesPage = lazy(() =>
  importSubscriptionInvoices().then((m) => ({ default: m.SubscriptionInvoicesPage }))
);

const MobileAppPage = lazy(() =>
  importMobileApp().then((m) => ({ default: m.MobileAppPage }))
);

const DownloadPage = lazy(() =>
  importDownload().then((m) => ({ default: m.DownloadPage }))
);

const HyperadminPage = lazy(() =>
  importHyperadmin().then((m) => ({ default: m.HyperadminPage }))
);

const HyperCompanyCreatePage = lazy(() =>
  importHyperCompanyCreate().then((m) => ({
    default: m.HyperCompanyCreatePage,
  }))
);

const HyperCompanyEditPage = lazy(() =>
  importHyperCompanyEdit().then((m) => ({ default: m.HyperCompanyEditPage }))
);

const ConfirmAccountDeletionPage = lazy(() =>
  importConfirmAccountDeletion().then((m) => ({
    default: m.ConfirmAccountDeletionPage,
  }))
);

const LegalTermsPage = lazy(() =>
  importLegalTerms().then((m) => ({ default: m.LegalTermsPage }))
);

const LegalPrivacyPage = lazy(() =>
  importLegalPrivacy().then((m) => ({ default: m.LegalPrivacyPage }))
);

const LegalCookiesPage = lazy(() =>
  importLegalCookies().then((m) => ({ default: m.LegalCookiesPage }))
);

function LegacySubscriptionInvoicesRedirect() {
  const { search, hash } = useLocation();
  return <Navigate to={`/app/subscription-invoices${search}${hash}`} replace />;
}

export default function App() {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void importDashboard();
      void importExpeditions();
      void importTours();
    }, 800);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <>
      <UpdateBanner />
      <ConsentBanner />
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
          </Route>
        </Route>

        <Route element={<AuthLayout />}>
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route
            path="/confirm-registration"
            element={<ConfirmRegistrationPage />}
          />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route
              path="/app"
              element={
                <Suspense fallback={<InlineSpinner />}>
                  <DashboardPage />
                </Suspense>
              }
            />
            <Route
              path="/app/expeditions"
              element={
                <Suspense fallback={<InlineSpinner />}>
                  <ExpeditionsPage />
                </Suspense>
              }
            />
            <Route
              path="/app/tours"
              element={
                <Suspense fallback={<InlineSpinner />}>
                  <ToursPage />
                </Suspense>
              }
            />
            <Route
              path="/app/tours/:id/order"
              element={
                <Suspense fallback={<InlineSpinner />}>
                  <TourOrderPage />
                </Suspense>
              }
            />
            <Route
              path="/app/tour-configs"
              element={
                <Suspense fallback={<InlineSpinner />}>
                  <TourConfigsPage />
                </Suspense>
              }
            />
            <Route
              path="/app/zones"
              element={
                <Suspense fallback={<InlineSpinner />}>
                  <ZonesPage />
                </Suspense>
              }
            />
            <Route
              path="/app/pharmacies"
              element={
                <Suspense fallback={<InlineSpinner />}>
                  <PharmaciesPage />
                </Suspense>
              }
            />
            <Route
              path="/app/pharmacy-reports"
              element={
                <Suspense fallback={<InlineSpinner />}>
                  <PharmacyReportsPage />
                </Suspense>
              }
            />
            <Route
              path="/app/pharmacies/new"
              element={
                <Suspense fallback={<InlineSpinner />}>
                  <PharmacyCreatePage />
                </Suspense>
              }
            />
            <Route
              path="/app/pharmacies/:cip"
              element={
                <Suspense fallback={<InlineSpinner />}>
                  <PharmacyDetailPage />
                </Suspense>
              }
            />
            {config.betaFeatures && (
              <Route
                path="/app/todos"
                element={
                  <Suspense fallback={<InlineSpinner />}>
                    <TodosPage />
                  </Suspense>
                }
              />
            )}
            <Route
              path="/app/commands"
              element={
                <Suspense fallback={<InlineSpinner />}>
                  <CommandsPage />
                </Suspense>
              }
            />
            <Route
              path="/app/commands/new"
              element={
                <Suspense fallback={<InlineSpinner />}>
                  <CommandCreatePage />
                </Suspense>
              }
            />
            <Route
              path="/app/commands/:id"
              element={
                <Suspense fallback={<InlineSpinner />}>
                  <CommandDetailPage />
                </Suspense>
              }
            />
            <Route
              path="/app/souffrance"
              element={
                <Suspense fallback={<InlineSpinner />}>
                  <SouffrancePage />
                </Suspense>
              }
            />
            <Route
              path="/app/anomalies"
              element={
                <Suspense fallback={<InlineSpinner />}>
                  <AnomaliesPage />
                </Suspense>
              }
            />
            <Route
              path="/app/anomalies/:id"
              element={
                <Suspense fallback={<InlineSpinner />}>
                  <AnomalyDetailPage />
                </Suspense>
              }
            />
            <Route
              path="/app/profiles"
              element={
                <Suspense fallback={<InlineSpinner />}>
                  <ProfilesPage />
                </Suspense>
              }
            />
            <Route
              path="/app/api-tokens"
              element={
                <Suspense fallback={<InlineSpinner />}>
                  <ApiTokensPage />
                </Suspense>
              }
            />
            <Route
              path="/app/subscription-invoices"
              element={
                <Suspense fallback={<InlineSpinner />}>
                  <SubscriptionInvoicesPage />
                </Suspense>
              }
            />
            <Route
              path="/app/factures"
              element={<LegacySubscriptionInvoicesRedirect />}
            />
            <Route
              path="/app/mobile-app"
              element={
                <Suspense fallback={<InlineSpinner />}>
                  <MobileAppPage />
                </Suspense>
              }
            />
            <Route
              path="/app/hyperadmin"
              element={
                <Suspense fallback={<InlineSpinner />}>
                  <HyperadminPage />
                </Suspense>
              }
            />
            <Route
              path="/app/hyperadmin/companies/new"
              element={
                <Suspense fallback={<InlineSpinner />}>
                  <HyperCompanyCreatePage />
                </Suspense>
              }
            />
            <Route
              path="/app/hyperadmin/companies/:accountId"
              element={
                <Suspense fallback={<InlineSpinner />}>
                  <HyperCompanyEditPage />
                </Suspense>
              }
            />
            <Route
              path="/app/notifications"
              element={
                <Suspense fallback={<InlineSpinner />}>
                  <NotificationsPage />
                </Suspense>
              }
            />
            <Route
              path="/app/account"
              element={
                <Suspense fallback={<InlineSpinner />}>
                  <AccountPage />
                </Suspense>
              }
            />
            <Route
              path="/app/settings"
              element={
                <Suspense fallback={<InlineSpinner />}>
                  <SettingsPage />
                </Suspense>
              }
            />
            <Route
              path="/app/exports"
              element={
                <Suspense fallback={<InlineSpinner />}>
                  <ExportsPage />
                </Suspense>
              }
            />
          </Route>
        </Route>

        <Route
          path="/confirm-account-deletion"
          element={
            <Suspense fallback={<FullPageSpinner />}>
              <ConfirmAccountDeletionPage />
            </Suspense>
          }
        />
        <Route path="/join" element={<JoinPage />} />
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/download"
          element={
            <Suspense fallback={<FullPageSpinner />}>
              <DownloadPage />
            </Suspense>
          }
        />
        <Route
          path="/legal/terms"
          element={
            <Suspense fallback={<FullPageSpinner />}>
              <LegalTermsPage />
            </Suspense>
          }
        />
        <Route
          path="/legal/privacy"
          element={
            <Suspense fallback={<FullPageSpinner />}>
              <LegalPrivacyPage />
            </Suspense>
          }
        />
        <Route
          path="/legal/cookies"
          element={
            <Suspense fallback={<FullPageSpinner />}>
              <LegalCookiesPage />
            </Suspense>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}
