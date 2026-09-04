import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import {
  Check,
  Copy,
  Download,
  Loader2,
  Pencil,
  ShieldAlert,
  Smartphone,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormField } from "@/components/form-field";
import { SwitchRow } from "@/components/field-row";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { useHyperError } from "@/components/hyperadmin/use-hyper-error";
import { useToast } from "@/app/toast-context";
import { copyText } from "@/lib/clipboard";
import { formatDateTime } from "@/lib/date";
import { formatBytes } from "@/lib/bytes";
import {
  APK_MAX_BYTES,
  apkDownloadUrl,
  isSameUpdate,
  isValidSemver,
  useDeleteMobileUpdate,
  useEditMobileUpdate,
  useLatestUpdate,
  useMobileUpdates,
  useUploadMobileUpdate,
  type MobileUpdate,
  type MobileUpdateEdit,
} from "@/features/updates";

function supportsEdit(update: MobileUpdate): boolean {
  return update.mandatory !== undefined || update.changelog !== undefined;
}

function editDiff(
  update: MobileUpdate,
  changelog: string,
  mandatory: boolean
): MobileUpdateEdit {
  const body: MobileUpdateEdit = {};
  if (changelog.trim() !== (update.changelog ?? "").trim()) {
    body.changelog = changelog.trim();
  }
  if (mandatory !== (update.mandatory ?? false)) body.mandatory = mandatory;
  return body;
}

function Sha256Copy({ update }: { update: MobileUpdate }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  if (!update.sha256) return null;
  const sha256 = update.sha256;

  const copy = async () => {
    if (await copyText(sha256)) {
      setCopied(true);
      toast.success(t("hyperadmin.updates.sha256Copied"));
      window.setTimeout(() => setCopied(false), 1500);
    } else {
      setCopied(false);
      toast.error(t("common.copyFailed"));
    }
  };

  const label = copied
    ? t("hyperadmin.updates.sha256Copied")
    : t("hyperadmin.updates.copySha256", { version: update.version });

  return (
    <Button
      type="button"
      variant="ghost"
      className="-ml-2 min-h-10 justify-start gap-1.5 px-2 font-normal text-muted-foreground lg:min-h-8"
      title={label}
      aria-label={label}
      onClick={() => void copy()}
    >
      {copied ? (
        <Check className="size-3.5 shrink-0" />
      ) : (
        <Copy className="size-3.5 shrink-0" />
      )}
      <span className="truncate font-mono text-xs">
        {sha256.slice(0, 12)}
      </span>
    </Button>
  );
}

export function HyperUpdatesPanel() {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? i18n.language;
  const errorMessage = useHyperError();
  const toast = useToast();

  const updatesQuery = useMobileUpdates();
  const latestQuery = useLatestUpdate();
  const uploadUpdate = useUploadMobileUpdate();
  const editUpdate = useEditMobileUpdate();
  const deleteUpdate = useDeleteMobileUpdate();

  const [version, setVersion] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0);
  const [changelog, setChangelog] = useState("");
  const [mandatory, setMandatory] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleting, setDeleting] = useState<MobileUpdate | null>(null);
  const [editing, setEditing] = useState<MobileUpdate | null>(null);
  const [editChangelog, setEditChangelog] = useState("");
  const [editMandatory, setEditMandatory] = useState(false);

  const updates = updatesQuery.data ?? [];
  const latest = latestQuery.data ?? null;

  const editBody = editing
    ? editDiff(editing, editChangelog, editMandatory)
    : {};
  const editDirty = Object.keys(editBody).length > 0;

  const validate = (): Record<string, string> => {
    const next: Record<string, string> = {};
    if (!version.trim()) next.version = t("common.required");
    else if (!isValidSemver(version)) {
      next.version = t("hyperadmin.updates.form.invalidVersion");
    }
    if (!file) next.file = t("common.required");
    else if (file.size > APK_MAX_BYTES) {
      next.file = t("hyperadmin.updates.form.apkTooLarge", {
        max: Math.round(APK_MAX_BYTES / (1024 * 1024)),
      });
    }
    return next;
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    uploadUpdate.mutate(
      {
        version: version.trim(),
        apk: file as File,
        changelog: changelog.trim() || undefined,
        mandatory: mandatory || undefined,
      },
      {
        onSuccess: (created) => {
          setVersion("");
          setFile(null);
          setFileKey((key) => key + 1);
          setChangelog("");
          setMandatory(false);
          toast.success(
            t("hyperadmin.updates.uploaded", { version: created.version })
          );
        },
        onError: (error) => {
          toast.error(
            errorMessage(error, "hyperadmin.updates.errors.uploadFailed")
          );
        },
      }
    );
  };

  const openEdit = (update: MobileUpdate) => {
    setEditing(update);
    setEditChangelog(update.changelog ?? "");
    setEditMandatory(update.mandatory ?? false);
  };

  const handleEditSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!editing || !editDirty) return;
    editUpdate.mutate(
      { version: editing.version, ...editBody },
      {
        onSuccess: (updated) => {
          setEditing(null);
          toast.success(
            t("hyperadmin.updates.edited", { version: updated.version })
          );
        },
        onError: (error) => {
          toast.error(
            errorMessage(error, "hyperadmin.updates.errors.editFailed")
          );
        },
      }
    );
  };

  const handleDelete = () => {
    if (!deleting) return;
    deleteUpdate.mutate(deleting.version, {
      onSuccess: () => setDeleting(null),
      onError: (error) => {
        setDeleting(null);
        toast.error(
          errorMessage(error, "hyperadmin.updates.errors.deleteFailed")
        );
      },
    });
  };

  const renderList = () => {
    if (updatesQuery.isLoading) return <LoadingState />;
    if (updatesQuery.isError) {
      return (
        <ErrorState
          error={updatesQuery.error}
          retrying={updatesQuery.isFetching}
          onRetry={() => void updatesQuery.refetch()}
        />
      );
    }
    if (updates.length === 0) {
      return (
        <EmptyState
          message={t("mobileApp.history.empty")}
          icon={<Smartphone className="size-8" />}
        />
      );
    }
    return (
      <ul className="flex flex-col divide-y divide-border rounded-xl border border-border bg-card">
        {updates.map((update) => (
          <li
            key={update.id}
            className="flex flex-col gap-3 p-3 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-foreground">
                  {update.version}
                </span>
                {update.versionCode != null && (
                  <span className="text-xs text-muted-foreground">
                    {t("hyperadmin.updates.versionCode", {
                      code: update.versionCode,
                    })}
                  </span>
                )}
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
                  {formatDateTime(update.createdAt, lang) ||
                    t("mobileApp.android.unknownDate")}
                </span>
                {update.size != null && (
                  <span>{formatBytes(update.size, lang)}</span>
                )}
              </p>
              {update.changelog && (
                <p className="mt-1 whitespace-pre-line text-xs text-muted-foreground">
                  {update.changelog}
                </p>
              )}
              <Sha256Copy update={update} />
            </div>
            <div className="flex shrink-0 items-center gap-2">
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
              {supportsEdit(update) && (
                <Button
                  variant="outline"
                  size="icon"
                  className="size-11 lg:size-9"
                  aria-label={t("hyperadmin.updates.editVersion", {
                    version: update.version,
                  })}
                  onClick={() => openEdit(update)}
                >
                  <Pencil className="size-4" />
                </Button>
              )}
              <Button
                variant="outline"
                size="icon"
                className="size-11 lg:size-9"
                aria-label={t("hyperadmin.updates.deleteVersion", {
                  version: update.version,
                })}
                onClick={() => setDeleting(update)}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="p-4">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-1"
            noValidate
          >
            <div className="grid grid-cols-1 gap-x-3 sm:grid-cols-2">
              <FormField
                label={t("hyperadmin.updates.form.version")}
                htmlFor="hyper-update-version"
                error={errors.version}
                hint={t("hyperadmin.updates.form.versionHint")}
                required
              >
                <Input
                  id="hyper-update-version"
                  value={version}
                  onChange={(event) => {
                    setVersion(event.target.value);
                    setErrors((previous) => ({ ...previous, version: "" }));
                  }}
                  placeholder="1.4.2"
                  autoComplete="off"
                  className="min-h-11 lg:min-h-10"
                />
              </FormField>

              <FormField
                label={t("hyperadmin.updates.form.apk")}
                htmlFor="hyper-update-apk"
                error={errors.file}
                hint={t("hyperadmin.updates.form.apkHint", {
                  max: Math.round(APK_MAX_BYTES / (1024 * 1024)),
                })}
                required
              >
                <Input
                  key={fileKey}
                  id="hyper-update-apk"
                  type="file"
                  accept=".apk,application/vnd.android.package-archive"
                  onChange={(event) => {
                    setFile(event.target.files?.[0] ?? null);
                    setErrors((previous) => ({ ...previous, file: "" }));
                  }}
                  className="min-h-11 pt-2.5 lg:min-h-10 lg:pt-2"
                />
              </FormField>

              <div className="sm:col-span-2">
                <FormField
                  label={t("hyperadmin.updates.form.changelog")}
                  htmlFor="hyper-update-changelog"
                  hint={t("hyperadmin.updates.form.changelogHint")}
                >
                  <Textarea
                    id="hyper-update-changelog"
                    value={changelog}
                    onChange={(event) => setChangelog(event.target.value)}
                    rows={3}
                  />
                </FormField>
              </div>

              <SwitchRow
                id="hyper-update-mandatory"
                checked={mandatory}
                onCheckedChange={setMandatory}
                icon={ShieldAlert}
                label={t("hyperadmin.updates.form.mandatory")}
                summary={t("hyperadmin.updates.form.mandatoryHint")}
                className="mb-4 sm:col-span-2"
              />
            </div>

            <Button
              type="submit"
              className="min-h-11 w-full sm:w-fit lg:min-h-10"
              disabled={uploadUpdate.isPending}
            >
              {uploadUpdate.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}
              {t("hyperadmin.updates.form.submit")}
            </Button>
            {uploadUpdate.isPending && (
              <p className="mt-1 text-xs text-muted-foreground">
                {t("hyperadmin.updates.uploading")}
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      {renderList()}

      <Dialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open && !editUpdate.isPending) setEditing(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t("hyperadmin.updates.edit.title", {
                version: editing?.version ?? "",
              })}
            </DialogTitle>
            <DialogDescription>
              {t("hyperadmin.updates.edit.description")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="flex flex-col gap-1">
            <FormField
              label={t("hyperadmin.updates.form.changelog")}
              htmlFor="hyper-update-edit-changelog"
            >
              <Textarea
                id="hyper-update-edit-changelog"
                value={editChangelog}
                onChange={(event) => setEditChangelog(event.target.value)}
                rows={4}
              />
            </FormField>
            <SwitchRow
              id="hyper-update-edit-mandatory"
              checked={editMandatory}
              onCheckedChange={setEditMandatory}
              icon={ShieldAlert}
              label={t("hyperadmin.updates.form.mandatory")}
              summary={t("hyperadmin.updates.form.mandatoryHint")}
              className="mb-4"
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 sm:min-h-10"
                onClick={() => setEditing(null)}
                disabled={editUpdate.isPending}
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="submit"
                className="min-h-11 sm:min-h-10"
                disabled={!editDirty || editUpdate.isPending}
              >
                {editUpdate.isPending && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                {t("common.save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open && !deleteUpdate.isPending) setDeleting(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("hyperadmin.updates.delete.title")}</DialogTitle>
            <DialogDescription>
              {t("hyperadmin.updates.delete.confirm", {
                version: deleting?.version ?? "",
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 sm:min-h-10"
              onClick={() => setDeleting(null)}
              disabled={deleteUpdate.isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="min-h-11 sm:min-h-10"
              onClick={handleDelete}
              disabled={deleteUpdate.isPending}
            >
              {deleteUpdate.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
