import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Mail, Phone } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { LEGAL_LINKS } from "@/components/legal/legal-links";
import { useConsent } from "@/hooks/use-consent";

const PRODUCT_LINKS = [
  { hash: "#audiences", labelKey: "landing.nav.audiences" },
  { hash: "#workflow", labelKey: "landing.nav.workflow" },
  { hash: "#features", labelKey: "landing.nav.features" },
  { hash: "#field", labelKey: "landing.nav.field" },
  { hash: "#faq", labelKey: "landing.nav.faq" },
];

const ACCESS_LINKS = [
  { to: "/login", labelKey: "landing.nav.login" },
  { to: "/register", labelKey: "landing.nav.register" },
  { to: "/forgot-password", labelKey: "auth.login.forgotPassword" },
  { to: "/download", labelKey: "mobileApp.footerLink" },
];

const LINK_CLASS =
  "inline-flex min-h-10 items-center text-sm text-muted-foreground transition-colors hover:text-foreground lg:min-h-8";

export function LandingFooter() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const { openPreferences } = useConsent();
  const anchorPrefix = pathname === "/" ? "" : "/";
  const year = new Date().getFullYear();

  return (
    <footer className="border-t bg-card">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-1">
          <Link to="/" aria-label={t("common.appName")} className="inline-flex">
            <BrandMark />
          </Link>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            {t("landing.footer.tagline")}
          </p>
          <ul className="mt-4 space-y-1">
            <li>
              <a href="tel:+33698291112" className={`${LINK_CLASS} gap-2`}>
                <Phone className="size-4" />
                {t("landing.cta.phone")}
              </a>
            </li>
            <li>
              <a
                href="mailto:clement.veillet@stack.bzh"
                className={`${LINK_CLASS} gap-2`}
              >
                <Mail className="size-4" />
                {t("landing.cta.email")}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-foreground">
            {t("landing.footer.product")}
          </h2>
          <ul className="mt-3 space-y-1">
            {PRODUCT_LINKS.map((link) => (
              <li key={link.hash}>
                <a
                  href={`${anchorPrefix}${link.hash}`}
                  className={LINK_CLASS}
                >
                  {t(link.labelKey)}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-foreground">
            {t("landing.footer.access")}
          </h2>
          <ul className="mt-3 space-y-1">
            {ACCESS_LINKS.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className={LINK_CLASS}>
                  {t(link.labelKey)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-foreground">
            {t("landing.footer.legal")}
          </h2>
          <ul className="mt-3 space-y-1">
            {LEGAL_LINKS.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className={LINK_CLASS}>
                  {t(link.labelKey)}
                </Link>
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={openPreferences}
                className={LINK_CLASS}
              >
                {t("consent.manage")}
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t">
        <div className="mx-auto w-full max-w-7xl px-4 py-4 text-center text-xs text-muted-foreground sm:px-6">
          {t("landing.footer.rights", { year, name: t("common.appName") })}
        </div>
      </div>
    </footer>
  );
}
