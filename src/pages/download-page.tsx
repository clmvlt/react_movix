import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, Smartphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingFooter } from "@/components/landing/landing-footer";
import { MobileAppPanels } from "@/components/mobile-app/mobile-app-panels";
import { setCanonical, setMetaDescription } from "@/lib/seo";

export function DownloadPage() {
  const { t } = useTranslation();

  useEffect(() => {
    const previousTitle = document.title;
    document.title = t("mobileApp.documentTitle");
    const restoreDescription = setMetaDescription(
      t("mobileApp.metaDescription")
    );
    const restoreCanonical = setCanonical("/download");
    return () => {
      document.title = previousTitle;
      restoreDescription();
      restoreCanonical();
    };
  }, [t]);

  return (
    <div className="flex min-h-dvh w-full flex-col bg-background">
      <LandingHeader showAnchors={false} />

      <main className="flex-1">
        <section className="relative overflow-hidden border-b">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-linear-to-b from-brand-50 to-background dark:from-accent"
          />
          <div className="relative mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
            <div className="mx-auto max-w-2xl text-center">
              <Badge variant="outline" className="bg-card">
                <Smartphone className="size-3.5" />
                {t("mobileApp.eyebrow")}
              </Badge>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                {t("mobileApp.title")}
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
                {t("mobileApp.subtitle")}
              </p>
            </div>

            <MobileAppPanels className="mt-10" />
          </div>
        </section>

        <section className="py-12 lg:py-16">
          <div className="mx-auto w-full max-w-3xl px-4 text-center sm:px-6">
            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {t("mobileApp.publicCta.title")}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
              {t("mobileApp.publicCta.subtitle")}
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link to="/login">
                  {t("mobileApp.publicCta.action")}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="w-full bg-card sm:w-auto"
              >
                <Link to="/">{t("mobileApp.publicCta.discover")}</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
