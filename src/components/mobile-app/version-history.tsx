import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Download, QrCode as QrCodeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { QrCode } from "@/components/qr-code";
import {
  apkDownloadUrl,
  isSameUpdate,
  useMobileUpdates,
  type MobileUpdate,
} from "@/features/updates";
import { formatDateTime } from "@/lib/date";
import { formatBytes } from "@/lib/bytes";

export function VersionHistory({ latest }: { latest: MobileUpdate | null }) {
  const { t, i18n } = useTranslation();
  const updatesQuery = useMobileUpdates();
  const [selected, setSelected] = useState<MobileUpdate | null>(null);

  const updates = updatesQuery.data ?? [];

  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">
        {t("mobileApp.history.title")}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("mobileApp.history.subtitle")}
      </p>

      <Card className="mt-4">
        <CardContent className="p-2 sm:p-4">
          {updatesQuery.isPending && <LoadingState />}

          {updatesQuery.isError && (
            <ErrorState
              error={updatesQuery.error}
              retrying={updatesQuery.isFetching}
              onRetry={() => void updatesQuery.refetch()}
            />
          )}

          {!updatesQuery.isPending && !updatesQuery.isError && (
            <>
              {updates.length === 0 ? (
                <EmptyState message={t("mobileApp.history.empty")} />
              ) : (
                <ul className="divide-y divide-border">
                  {updates.map((update) => {
                    const published = formatDateTime(
                      update.createdAt,
                      i18n.language
                    );
                    return (
                      <li
                        key={update.id}
                        className="flex flex-col gap-3 px-2 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-0"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-foreground">
                              {update.version}
                            </span>
                            {isSameUpdate(update, latest) && (
                              <Badge variant="secondary">
                                {t("mobileApp.history.current")}
                              </Badge>
                            )}
                            {update.mandatory && (
                              <Badge>{t("mobileApp.history.mandatory")}</Badge>
                            )}
                          </div>
                          <p className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-muted-foreground">
                            <span>
                              {published || t("mobileApp.android.unknownDate")}
                            </span>
                            {update.size != null && (
                              <span>
                                {formatBytes(update.size, i18n.language)}
                              </span>
                            )}
                          </p>
                          {update.changelog && (
                            <p className="mt-1 whitespace-pre-line text-xs text-muted-foreground">
                              {update.changelog}
                            </p>
                          )}
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="size-11 lg:size-9"
                            aria-label={t("mobileApp.history.showQr", {
                              version: update.version,
                            })}
                            onClick={() => setSelected(update)}
                          >
                            <QrCodeIcon className="size-4" />
                          </Button>
                          <Button
                            asChild
                            variant="outline"
                            size="icon"
                            className="size-11 lg:size-9"
                            aria-label={t("mobileApp.history.downloadVersion", {
                              version: update.version,
                            })}
                          >
                            <a href={apkDownloadUrl(update)} rel="noopener">
                              <Download className="size-4" />
                            </a>
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {t("mobileApp.history.dialogTitle", {
                version: selected?.version ?? "",
              })}
            </DialogTitle>
            <DialogDescription>{t("mobileApp.scanHint")}</DialogDescription>
          </DialogHeader>
          {selected && (
            <>
              <div className="mx-auto w-full max-w-[240px]">
                <QrCode
                  value={apkDownloadUrl(selected)}
                  label={t("mobileApp.android.qrLabel")}
                />
              </div>
              <Button asChild className="min-h-11 w-full lg:min-h-10">
                <a href={apkDownloadUrl(selected)} rel="noopener">
                  <Download className="size-4" />
                  {t("mobileApp.android.action")}
                </a>
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
