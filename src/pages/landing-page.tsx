import { useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  Bell,
  Building2,
  ChevronDown,
  FileSpreadsheet,
  Globe,
  Inbox,
  Languages,
  Layers,
  Mail,
  MapPinned,
  MonitorSmartphone,
  PackageSearch,
  PackageX,
  Phone,
  Radio,
  Route as RouteIcon,
  ShieldCheck,
  Smartphone,
  Sparkles,
  TriangleAlert,
  Truck,
  UserPlus,
  Users,
  Warehouse,
  Waypoints,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingFooter } from "@/components/landing/landing-footer";
import { MockShipments } from "@/components/landing/mock-shipments";
import { MockTourOrder } from "@/components/landing/mock-tour-order";
import { MockPhone } from "@/components/landing/mock-phone";
import { MockMap } from "@/components/landing/mock-map";
import {
  ALL_ROUTES,
  DEPOT,
  SCATTER_PINS,
  TOUR_COLORS,
  ZONES,
} from "@/components/landing/mock-data";
import { setJsonLd, usePageSeo } from "@/lib/seo";
import { cn } from "@/lib/utils";
import mobileHomeUrl from "@/assets/images/mobile/accueil.webp";
import mobileToursUrl from "@/assets/images/mobile/tournees.webp";
import mobileAnomalyUrl from "@/assets/images/mobile/anomalie.webp";

interface Entry {
  key: string;
  icon: LucideIcon;
}

const TRUST: Entry[] = [
  { key: "web", icon: MonitorSmartphone },
  { key: "stores", icon: Smartphone },
  { key: "routing", icon: Waypoints },
  { key: "languages", icon: Languages },
];

const HIGHLIGHTS: Entry[] = [
  { key: "map", icon: MapPinned },
  { key: "optimize", icon: Sparkles },
  { key: "realtime", icon: Radio },
];

const AUDIENCES: Entry[] = [
  { key: "wholesalers", icon: Warehouse },
  { key: "carriers", icon: Truck },
  { key: "depots", icon: Building2 },
];

const STEPS: Entry[] = [
  { key: "intake", icon: Inbox },
  { key: "build", icon: Layers },
  { key: "optimize", icon: Sparkles },
  { key: "close", icon: ShieldCheck },
];

const FEATURES: Entry[] = [
  { key: "expeditions", icon: Truck },
  { key: "tours", icon: RouteIcon },
  { key: "commands", icon: PackageSearch },
  { key: "souffrance", icon: PackageX },
  { key: "anomalies", icon: TriangleAlert },
  { key: "pharmacies", icon: Building2 },
  { key: "zones", icon: MapPinned },
  { key: "exports", icon: FileSpreadsheet },
  { key: "profiles", icon: Users },
  { key: "notifications", icon: Bell },
];

const MAP_POINTS = ["zones", "routes", "eta"];

const FAQ_KEYS = ["who", "access", "mobile", "routing", "exports", "languages"];

const MOBILE_SCREENS = [
  { key: "home", src: mobileHomeUrl },
  { key: "tours", src: mobileToursUrl },
  { key: "anomaly", src: mobileAnomalyUrl },
];

const TOUR_LEGEND = [
  { key: "north", color: TOUR_COLORS.north },
  { key: "east", color: TOUR_COLORS.east },
  { key: "south", color: TOUR_COLORS.south },
];

function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  align?: "center" | "start";
}) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" ? "mx-auto text-center" : "text-left"
      )}
    >
      <Badge variant="secondary" className="uppercase tracking-wide">
        {eyebrow}
      </Badge>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {title}
      </h2>
      <p className="mt-3 text-sm text-muted-foreground sm:text-base">
        {subtitle}
      </p>
    </div>
  );
}

function IconBubble({
  icon: Icon,
  className,
}: {
  icon: LucideIcon;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground",
        className
      )}
    >
      <Icon className="size-5" />
    </span>
  );
}

function Section({
  id,
  children,
  className,
}: {
  id?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn("border-b py-14 lg:py-20", className)}>
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">{children}</div>
    </section>
  );
}

export function LandingPage() {
  const { t } = useTranslation();

  usePageSeo({
    title: t("landing.documentTitle"),
    description: t("landing.metaDescription"),
    path: "/",
  });

  useEffect(
    () =>
      setJsonLd("faq", {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: FAQ_KEYS.map((key) => ({
          "@type": "Question",
          name: t(`landing.faq.items.${key}.q`),
          acceptedAnswer: {
            "@type": "Answer",
            text: t(`landing.faq.items.${key}.a`),
          },
        })),
      }),
    [t]
  );

  return (
    <div className="flex min-h-dvh w-full flex-col bg-background">
      <LandingHeader />

      <main className="flex-1">
        <section className="relative overflow-hidden border-b">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-linear-to-b from-brand-50 to-background dark:from-accent"
          />
          <div className="relative mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:py-20">
            <div className="mx-auto max-w-3xl text-center">
              <Badge variant="outline" className="bg-card">
                <Truck className="size-3.5" />
                {t("landing.hero.eyebrow")}
              </Badge>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                {t("landing.hero.title")}
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
                {t("landing.hero.subtitle")}
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link to="/register">
                    <UserPlus className="size-4" />
                    {t("landing.hero.ctaPrimary")}
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="w-full bg-card sm:w-auto"
                >
                  <a href="#workflow">
                    {t("landing.hero.ctaSecondary")}
                    <ArrowRight className="size-4" />
                  </a>
                </Button>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                {t("landing.hero.haveAccount")}{" "}
                <Link
                  to="/login"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  {t("landing.hero.signIn")}
                </Link>
              </p>
            </div>

            <div className="mt-10 lg:mt-14">
              <MockShipments className="hidden md:block" />
              <MockPhone className="md:hidden" />
            </div>

            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:mt-14 lg:grid-cols-4">
              {TRUST.map((item) => (
                <li
                  key={item.key}
                  className="flex items-start gap-3 rounded-xl border bg-card/80 p-4 backdrop-blur"
                >
                  <IconBubble icon={item.icon} className="size-10" />
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">
                      {t(`landing.trust.${item.key}.title`)}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {t(`landing.trust.${item.key}.desc`)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <Section className="bg-card">
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {HIGHLIGHTS.map((item) => (
              <li key={item.key} className="flex items-start gap-4">
                <IconBubble icon={item.icon} />
                <div className="min-w-0">
                  <h2 className="font-semibold text-foreground">
                    {t(`landing.highlights.${item.key}.title`)}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t(`landing.highlights.${item.key}.desc`)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="audiences">
          <SectionHeading
            eyebrow={t("landing.audiences.eyebrow")}
            title={t("landing.audiences.title")}
            subtitle={t("landing.audiences.subtitle")}
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {AUDIENCES.map((item) => (
              <Card key={item.key} className="h-full">
                <CardContent className="flex h-full flex-col gap-4 p-6">
                  <IconBubble
                    icon={item.icon}
                    className="size-12 bg-primary text-primary-foreground"
                  />
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-foreground">
                      {t(`landing.audiences.items.${item.key}.title`)}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {t(`landing.audiences.items.${item.key}.desc`)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </Section>

        <Section id="workflow" className="bg-card">
          <SectionHeading
            eyebrow={t("landing.workflow.eyebrow")}
            title={t("landing.workflow.title")}
            subtitle={t("landing.workflow.subtitle")}
          />
          <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-14">
            <ol className="relative space-y-6">
              {STEPS.map((step, index) => (
                <li key={step.key} className="relative flex gap-4">
                  <div className="flex flex-col items-center">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                      {index + 1}
                    </span>
                    {index < STEPS.length - 1 && (
                      <span
                        aria-hidden
                        className="mt-1 w-px flex-1 bg-border"
                      />
                    )}
                  </div>
                  <div className="min-w-0 pb-2">
                    <h3 className="flex items-center gap-2 font-semibold text-foreground">
                      <step.icon className="size-4 text-muted-foreground" />
                      {t(`landing.workflow.steps.${step.key}.title`)}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t(`landing.workflow.steps.${step.key}.desc`)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <MockTourOrder />
          </div>
        </Section>

        <Section id="features">
          <SectionHeading
            eyebrow={t("landing.features.eyebrow")}
            title={t("landing.features.title")}
            subtitle={t("landing.features.subtitle")}
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {FEATURES.map((feature) => (
              <Card key={feature.key} className="h-full">
                <CardContent className="flex h-full flex-col gap-3 p-5">
                  <IconBubble icon={feature.icon} className="size-10" />
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground">
                      {t(`landing.features.items.${feature.key}.title`)}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t(`landing.features.items.${feature.key}.desc`)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </Section>

        <Section className="bg-card">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-14">
            <div className="order-2 overflow-hidden rounded-xl border bg-card shadow-lg lg:order-1">
              <MockMap
                className="aspect-[4/3] w-full"
                pins={SCATTER_PINS}
                routes={ALL_ROUTES}
                zones={ZONES}
                depot={DEPOT}
              />
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t px-4 py-3">
                {TOUR_LEGEND.map((tour) => (
                  <span
                    key={tour.key}
                    className="flex items-center gap-2 text-xs text-muted-foreground"
                  >
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: tour.color }}
                    />
                    {t(`landing.map.legend.${tour.key}`)}
                  </span>
                ))}
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="size-2.5 rounded-[3px] bg-brand-800" />
                  {t("landing.mock.depot")}
                </span>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <SectionHeading
                align="start"
                eyebrow={t("landing.map.eyebrow")}
                title={t("landing.map.title")}
                subtitle={t("landing.map.subtitle")}
              />
              <ul className="mt-6 space-y-4">
                {MAP_POINTS.map((point) => (
                  <li key={point} className="flex gap-3">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {t(`landing.map.points.${point}.title`)}
                      </span>{" "}
                      {t(`landing.map.points.${point}.desc`)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Section>

        <Section id="field">
          <SectionHeading
            eyebrow={t("landing.field.eyebrow")}
            title={t("landing.field.title")}
            subtitle={t("landing.field.subtitle")}
          />
          <div className="mt-10 grid gap-10 md:grid-cols-3 md:gap-6 xl:gap-10">
            {MOBILE_SCREENS.map((screen, index) => (
              <figure key={screen.key} className="flex flex-col">
                <div className="mx-auto w-full max-w-[320px] overflow-hidden rounded-3xl border border-border shadow-lg">
                  <img
                    src={screen.src}
                    alt={t(`landing.field.screens.${screen.key}.alt`)}
                    loading="lazy"
                    decoding="async"
                    width={720}
                    height={1558}
                    className="block aspect-720/1558 h-auto w-full object-cover"
                  />
                </div>
                <figcaption className="mx-auto mt-5 w-full max-w-[320px]">
                  <h3 className="flex items-center gap-2 font-semibold text-foreground">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                      {index + 1}
                    </span>
                    {t(`landing.field.screens.${screen.key}.title`)}
                  </h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {t(`landing.field.screens.${screen.key}.desc`)}
                  </p>
                </figcaption>
              </figure>
            ))}
          </div>
          <div className="mt-10 flex justify-center">
            <Button asChild size="lg" variant="outline" className="w-full bg-card sm:w-auto">
              <Link to="/download">
                <Smartphone className="size-4" />
                {t("landing.field.download")}
              </Link>
            </Button>
          </div>
        </Section>

        <Section id="faq" className="bg-card">
          <SectionHeading
            eyebrow={t("landing.faq.eyebrow")}
            title={t("landing.faq.title")}
            subtitle={t("landing.faq.subtitle")}
          />
          <div className="mx-auto mt-10 max-w-3xl divide-y divide-border rounded-xl border bg-background">
            {FAQ_KEYS.map((key) => (
              <details key={key} className="group">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left [&::-webkit-details-marker]:hidden">
                  <h3 className="font-medium text-foreground">
                    {t(`landing.faq.items.${key}.q`)}
                  </h3>
                  <ChevronDown
                    aria-hidden
                    className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                  />
                </summary>
                <p className="px-5 pb-5 text-sm text-muted-foreground">
                  {t(`landing.faq.items.${key}.a`)}
                </p>
              </details>
            ))}
          </div>
        </Section>

        <section className="bg-brand-600 py-14 lg:py-20">
          <div className="mx-auto w-full max-w-3xl px-4 text-center sm:px-6">
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {t("landing.cta.title")}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-white/80 sm:text-base">
              {t("landing.cta.subtitle")}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="w-full sm:w-auto"
              >
                <Link to="/register">
                  <UserPlus className="size-4" />
                  {t("landing.cta.register")}
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="w-full border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white sm:w-auto"
              >
                <a href="tel:+33698291112">
                  <Phone className="size-4" />
                  {t("landing.cta.phone")}
                </a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="w-full border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white sm:w-auto"
              >
                <a href="mailto:clement.veillet@stack.bzh">
                  <Mail className="size-4" />
                  {t("landing.cta.email")}
                </a>
              </Button>
            </div>
            <p className="mt-4 flex items-center justify-center gap-2 text-xs text-white/80">
              <Globe className="size-4" />
              {t("landing.cta.note")}
            </p>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
