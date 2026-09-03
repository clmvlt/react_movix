import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/brand-mark";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useAuth } from "@/app/auth-context";

const ANCHORS = [
  { hash: "#audiences", labelKey: "landing.nav.audiences" },
  { hash: "#workflow", labelKey: "landing.nav.workflow" },
  { hash: "#features", labelKey: "landing.nav.features" },
  { hash: "#field", labelKey: "landing.nav.field" },
  { hash: "#faq", labelKey: "landing.nav.faq" },
];

export function LandingHeader({ showAnchors = true }: { showAnchors?: boolean }) {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { pathname } = useLocation();
  const anchorPrefix = pathname === "/" ? "" : "/";

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link to="/" aria-label={t("common.appName")} className="shrink-0">
          <BrandMark />
        </Link>

        {showAnchors && (
          <nav className="ml-4 hidden min-w-0 flex-1 items-center gap-1 lg:flex">
            {ANCHORS.map((anchor) => (
              <a
                key={anchor.hash}
                href={`${anchorPrefix}${anchor.hash}`}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                {t(anchor.labelKey)}
              </a>
            ))}
          </nav>
        )}

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <LanguageSwitcher />
          {isAuthenticated ? (
            <Button asChild className="min-h-11 lg:min-h-10">
              <Link to="/app">
                {t("landing.nav.openApp")}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          ) : (
            <>
              <Button
                asChild
                variant="ghost"
                className="hidden min-h-10 sm:inline-flex"
              >
                <Link to="/login">{t("landing.nav.login")}</Link>
              </Button>
              <Button asChild className="min-h-11 lg:min-h-10">
                <Link to="/register">{t("landing.nav.register")}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
