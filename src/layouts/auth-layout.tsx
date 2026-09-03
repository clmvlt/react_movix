import { useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  MapPinned,
  Smartphone,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { BrandMark } from "@/components/brand-mark";
import { LEGAL_LINKS } from "@/components/legal/legal-links";
import { setRobotsNoindex } from "@/lib/seo";

const INDEXABLE_PATHS = new Set(["/login", "/register"]);

const PANEL_POINTS: { key: string; icon: LucideIcon }[] = [
  { key: "map", icon: MapPinned },
  { key: "route", icon: Sparkles },
  { key: "driver", icon: Smartphone },
];

export function AuthLayout() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const indexable = INDEXABLE_PATHS.has(pathname);

  useEffect(() => {
    if (indexable) return;
    return setRobotsNoindex();
  }, [indexable]);

  return (
    <div className="flex min-h-dvh w-full flex-col bg-background lg:flex-row">
      <aside className="relative hidden overflow-hidden bg-brand-800 text-white lg:flex lg:w-[42%] lg:flex-col lg:justify-between lg:p-10 xl:w-[40%] xl:p-14">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-linear-to-br from-brand-600 to-brand-800"
        />
        <Link
          to="/"
          aria-label={t("common.appName")}
          className="relative inline-flex w-fit"
        >
          <BrandMark inverted />
        </Link>
        <div className="relative max-w-md">
          <h2 className="text-3xl font-semibold tracking-tight xl:text-4xl">
            {t("auth.panel.title")}
          </h2>
          <p className="mt-4 text-base text-white/80">
            {t("auth.panel.subtitle")}
          </p>
          <ul className="mt-8 space-y-5">
            {PANEL_POINTS.map((point) => (
              <li key={point.key} className="flex items-start gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <point.icon className="size-5" />
                </span>
                <p className="pt-2 text-sm text-white/90">
                  {t(`auth.panel.points.${point.key}`)}
                </p>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-white/70">
          {t("landing.footer.tagline")}
        </p>
      </aside>

      <div className="flex min-h-dvh flex-1 flex-col lg:min-h-0">
        <header className="flex items-center justify-between gap-2 px-4 py-4 sm:px-6">
          <Link
            to="/"
            aria-label={t("common.appName")}
            className="inline-flex lg:hidden"
          >
            <BrandMark />
          </Link>
          <div className="ml-auto flex items-center gap-1">
            <Button asChild variant="ghost" className="min-h-10">
              <Link to="/">
                <ArrowLeft className="size-4" />
                {t("auth.panel.backToSite")}
              </Link>
            </Button>
            <LanguageSwitcher />
          </div>
        </header>
        <main className="flex flex-1 items-center justify-center px-4 py-8 sm:py-12">
          <div className="w-full max-w-md">
            <Outlet />
          </div>
        </main>
        <footer className="flex flex-col items-center gap-2 px-4 py-6 text-center text-xs text-muted-foreground">
          <nav
            aria-label={t("legal.navLabel")}
            className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1"
          >
            {LEGAL_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="inline-flex min-h-8 items-center transition-colors hover:text-foreground"
              >
                {t(link.labelKey)}
              </Link>
            ))}
          </nav>
          <span>{t("common.appName")}</span>
        </footer>
      </div>
    </div>
  );
}
