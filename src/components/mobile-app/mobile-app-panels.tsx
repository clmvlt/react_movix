import { useMemo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  Download,
  ExternalLink,
  FlaskConical,
  Smartphone,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InlineSpinner } from "@/components/full-page-spinner";
import { StoreCard } from "./store-card";
import {
  APP_STORE_URL,
  TESTFLIGHT_URL,
  detectMobilePlatform,
  testFlightAvailable,
  type MobilePlatform,
} from "@/lib/mobile-app";
import { apkDownloadUrl, useLatestUpdate } from "@/features/updates";
import { formatDate } from "@/lib/date";
import { formatBytes } from "@/lib/bytes";
import { cn } from "@/lib/utils";

type BlockKey = "android" | "ios" | "testflight";

function orderedKeys(platform: MobilePlatform): BlockKey[] {
  if (platform === "ios") return ["ios", "testflight", "android"];
  return ["android", "ios", "testflight"];
}

export function MobileAppPanels({ className }: { className?: string }) {
  const { t, i18n } = useTranslation();
  const platform = useMemo(() => detectMobilePlatform(), []);
  const latestQuery = useLatestUpdate();

  const latest = latestQuery.data ?? null;
  const apkUrl = latest ? apkDownloadUrl(latest) : null;
  const showTestFlight = testFlightAvailable();

  const publishedAt = latest?.createdAt
    ? formatDate(latest.createdAt, i18n.language)
    : "";

  const androidMeta = latest ? (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="outline">
        {t("mobileApp.android.version", { version: latest.version })}
      </Badge>
      {latest.mandatory && (
        <Badge>{t("mobileApp.history.mandatory")}</Badge>
      )}
      <span className="text-xs text-muted-foreground">
        {publishedAt
          ? t("mobileApp.android.published", { date: publishedAt })
          : t("mobileApp.android.unknownDate")}
      </span>
      {latest.size != null && (
        <span className="text-xs text-muted-foreground">
          {formatBytes(latest.size, i18n.language)}
        </span>
      )}
    </div>
  ) : null;

  let androidFallback: ReactNode = null;
  if (!apkUrl) {
    if (latestQuery.isPending) {
      androidFallback = <InlineSpinner className="py-10" />;
    } else if (latestQuery.isError) {
      androidFallback = (
        <Alert variant="destructive" className="flex flex-col gap-3">
          <AlertCircle />
          <AlertDescription>{t("errors.loadFailed")}</AlertDescription>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void latestQuery.refetch()}
            className="w-fit"
          >
            {t("common.retry")}
          </Button>
        </Alert>
      );
    } else {
      androidFallback = (
        <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
          {t("mobileApp.android.empty")}
        </p>
      );
    }
  }

  const blocks: Record<BlockKey, ReactNode> = {
    android: (
      <StoreCard
        key="android"
        icon={Smartphone}
        title={t("mobileApp.android.title")}
        description={t("mobileApp.android.description")}
        qrValue={apkUrl}
        qrLabel={t("mobileApp.android.qrLabel")}
        recommended={platform === "android"}
        meta={androidMeta}
        fallback={androidFallback}
        note={
          apkUrl ? (
            <div className="flex flex-col gap-2">
              {latest?.changelog && (
                <div>
                  <p className="text-xs font-medium text-foreground">
                    {t("mobileApp.android.changelogTitle")}
                  </p>
                  <p className="mt-1 whitespace-pre-line text-xs text-muted-foreground">
                    {latest.changelog}
                  </p>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {t("mobileApp.android.warning")}
              </p>
            </div>
          ) : null
        }
        action={
          apkUrl ? (
            <Button asChild className="min-h-11 w-full lg:min-h-10">
              <a href={apkUrl} rel="noopener">
                <Download className="size-4" />
                {t("mobileApp.android.action")}
              </a>
            </Button>
          ) : (
            <Button className="min-h-11 w-full lg:min-h-10" disabled>
              <Download className="size-4" />
              {t("mobileApp.android.action")}
            </Button>
          )
        }
      />
    ),
    ios: (
      <StoreCard
        key="ios"
        icon={Store}
        title={t("mobileApp.ios.title")}
        description={t("mobileApp.ios.description")}
        qrValue={APP_STORE_URL}
        qrLabel={t("mobileApp.ios.qrLabel")}
        recommended={platform === "ios"}
        action={
          <Button asChild className="min-h-11 w-full lg:min-h-10">
            <a href={APP_STORE_URL} target="_blank" rel="noreferrer noopener">
              <ExternalLink className="size-4" />
              {t("mobileApp.ios.action")}
            </a>
          </Button>
        }
      />
    ),
    testflight: showTestFlight ? (
      <StoreCard
        key="testflight"
        icon={FlaskConical}
        title={t("mobileApp.testflight.title")}
        description={t("mobileApp.testflight.description")}
        qrValue={TESTFLIGHT_URL}
        qrLabel={t("mobileApp.testflight.qrLabel")}
        note={
          <p className="text-xs text-muted-foreground">
            {t("mobileApp.testflight.requirement")}
          </p>
        }
        action={
          <Button
            asChild
            variant="outline"
            className="min-h-11 w-full lg:min-h-10"
          >
            <a href={TESTFLIGHT_URL} target="_blank" rel="noreferrer noopener">
              <ExternalLink className="size-4" />
              {t("mobileApp.testflight.action")}
            </a>
          </Button>
        }
      />
    ) : null,
  };

  const visible = orderedKeys(platform)
    .map((key) => blocks[key])
    .filter(Boolean);

  return (
    <div
      className={cn(
        "grid gap-4 md:grid-cols-2",
        visible.length > 2 && "xl:grid-cols-3",
        className
      )}
    >
      {visible}
    </div>
  );
}
