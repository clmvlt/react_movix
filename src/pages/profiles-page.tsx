import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Loader2, Pencil, Plus, Search, Ticket, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/page-header";
import { ApiError } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { NotProvided } from "@/components/not-provided";
import { ProfileFormDialog } from "@/components/profile-form-dialog";
import { GrantWebDialog } from "@/components/profiles/grant-web-dialog";
import { InvitationsDialog } from "@/components/profiles/invitations-dialog";
import { ProfilKindIcon } from "@/components/profiles/profil-kind-icon";
import { useIsAdmin } from "@/components/admin-gate";
import { useAuth } from "@/app/auth-context";
import { useToast } from "@/app/toast-context";
import { profilFullName, type Profil } from "@/features/auth";
import { useDeleteProfile, useProfiles } from "@/features/profiles";

export function ProfilesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = useIsAdmin();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") ?? "";

  const { data, isLoading, isError, refetch } = useProfiles();
  const deleteProfile = useDeleteProfile();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Profil | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Profil | null>(null);
  const [invitationsOpen, setInvitationsOpen] = useState(false);
  const [grantTarget, setGrantTarget] = useState<Profil | null>(null);

  const canInvite = Boolean(user?.userId) && isAdmin;
  const canManage = (profile: Profil) =>
    isAdmin || (!profile.isWeb && !profile.userId);

  const setQuery = (value: string) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set("q", value);
        else next.delete("q");
        return next;
      },
      { replace: true }
    );
  };

  const rows = useMemo(() => {
    const list = data ?? [];
    const term = q.trim().toLowerCase();
    if (!term) return list;
    return list.filter((p) =>
      [p.identifiant, p.firstName, p.lastName, p.email]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(term))
    );
  }, [data, q]);

  const activeRows = useMemo(() => rows.filter((p) => p.isActive), [rows]);
  const inactiveRows = useMemo(() => rows.filter((p) => !p.isActive), [rows]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (profile: Profil) => {
    setEditing(profile);
    setFormOpen(true);
  };

  const closeDelete = () => {
    setDeleteTarget(null);
  };

  const removal = Boolean(deleteTarget?.userId);
  const deleteTargetName =
    deleteTarget?.identifiant ||
    profilFullName(deleteTarget) ||
    deleteTarget?.email ||
    "";

  const confirmDelete = () => {
    if (
      !deleteTarget ||
      deleteTarget.id === user?.id ||
      !canManage(deleteTarget)
    ) {
      closeDelete();
      return;
    }
    deleteProfile.mutate(deleteTarget.id, {
      onSuccess: closeDelete,
      onError: (err) => {
        if (err instanceof ApiError && err.status === 409) {
          toast.error(err.message || t("profiles.delete.self"));
        } else if (err instanceof ApiError && err.message) {
          toast.error(err.message);
        } else {
          toast.error(t("common.error"));
        }
      },
    });
  };

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title={t("profiles.title")}
        subtitle={t("profiles.subtitle")}
        actions={
          <>
            {canInvite && (
              <Button
                variant="outline"
                className="min-h-11 lg:min-h-10"
                onClick={() => setInvitationsOpen(true)}
                aria-label={t("profiles.invitations.open")}
              >
                <Ticket className="size-4" />
                <span className="hidden sm:inline">
                  {t("profiles.invitations.open")}
                </span>
              </Button>
            )}
            <Button className="min-h-11 lg:min-h-10" onClick={openCreate}>
              <Plus className="size-4" />
              <span className="hidden sm:inline">{t("profiles.create")}</span>
            </Button>
          </>
        }
      />

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("profiles.searchPlaceholder")}
          className="min-h-11 pl-9 lg:min-h-10"
          aria-label={t("common.search")}
        />
      </div>

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState
          message={t("profiles.empty")}
          icon={<Users className="size-8" />}
        />
      ) : (
        <div className="flex flex-col gap-6">
          {activeRows.length === 0 ? (
            <EmptyState
              message={t("profiles.empty")}
              icon={<Users className="size-8" />}
            />
          ) : (
            <ProfilesList
              profiles={activeRows}
              currentUserId={user?.id}
              canManage={canManage}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
            />
          )}

          {inactiveRows.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2 className="px-1 text-xs font-medium uppercase text-muted-foreground">
                {t("profiles.inactiveTitle")} ({inactiveRows.length})
              </h2>
              <ProfilesList
                profiles={inactiveRows}
                currentUserId={user?.id}
                canManage={canManage}
                onEdit={openEdit}
                onDelete={setDeleteTarget}
                muted
              />
            </section>
          )}
        </div>
      )}

      <ProfileFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        profile={editing}
        onGrantWeb={setGrantTarget}
      />

      <GrantWebDialog
        profil={grantTarget}
        onClose={() => setGrantTarget(null)}
      />

      <InvitationsDialog
        open={invitationsOpen}
        onOpenChange={setInvitationsOpen}
      />

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && closeDelete()}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {removal ? t("profiles.remove.title") : t("profiles.delete.title")}
            </DialogTitle>
            <DialogDescription>
              {removal
                ? t("profiles.remove.confirm", { name: deleteTargetName })
                : t("profiles.delete.confirm", { name: deleteTargetName })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              className="min-h-11 sm:min-h-10"
              onClick={closeDelete}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              className="min-h-11 sm:min-h-10"
              onClick={confirmDelete}
              disabled={deleteProfile.isPending}
            >
              {deleteProfile.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              {removal ? t("profiles.remove.action") : t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ProfilesListProps {
  profiles: Profil[];
  currentUserId?: Profil["id"];
  canManage: (profile: Profil) => boolean;
  onEdit: (profile: Profil) => void;
  onDelete: (profile: Profil) => void;
  muted?: boolean;
}

function ProfilesList(props: ProfilesListProps) {
  return (
    <>
      <ProfilesTable {...props} />
      <ProfilesCardList {...props} />
    </>
  );
}

function AccessBadges({ profile }: { profile: Profil }) {
  const { t } = useTranslation();
  return (
    <>
      {profile.userId && (
        <Badge variant="secondary">{t("profiles.linkedBadge")}</Badge>
      )}
      {profile.isAdmin && (
        <Badge variant="secondary">{t("profiles.access.admin")}</Badge>
      )}
      {profile.isWeb && (
        <Badge variant="outline">{t("profiles.access.web")}</Badge>
      )}
      {profile.isMobile && (
        <Badge variant="outline">{t("profiles.access.mobile")}</Badge>
      )}
    </>
  );
}

function ProfileActions({
  profile,
  currentUserId,
  onEdit,
  onDelete,
  className,
  compact,
}: {
  profile: Profil;
  currentUserId?: Profil["id"];
  onEdit: (profile: Profil) => void;
  onDelete: (profile: Profil) => void;
  className?: string;
  compact?: boolean;
}) {
  const { t } = useTranslation();
  const isSelf = profile.id === currentUserId;
  const size = compact ? "size-8" : "size-11 lg:size-8";
  const icon = compact ? "size-4" : "size-5 lg:size-4";
  let deleteLabel = profile.userId
    ? t("profiles.remove.action")
    : t("common.delete");
  if (isSelf) deleteLabel = t("profiles.delete.self");

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn("shrink-0", size)}
        onClick={() => onEdit(profile)}
        aria-label={t("common.edit")}
        title={t("common.edit")}
      >
        <Pencil className={icon} />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn("shrink-0", size)}
        onClick={() => onDelete(profile)}
        disabled={isSelf}
        aria-label={deleteLabel}
        title={deleteLabel}
      >
        <Trash2 className={cn("text-destructive", icon)} />
      </Button>
    </div>
  );
}

function ProfilesTable({
  profiles,
  currentUserId,
  canManage,
  onEdit,
  onDelete,
  muted,
}: ProfilesListProps) {
  const { t } = useTranslation();
  return (
    <div className="hidden w-full rounded-xl border lg:block">
      <Table className="min-w-[720px]">
        <TableHeader>
          <TableRow>
            <TableHead>{t("profiles.form.identifiant")}</TableHead>
            <TableHead>{t("common.name")}</TableHead>
            <TableHead>{t("common.email")}</TableHead>
            <TableHead>{t("profiles.accessLabel")}</TableHead>
            <TableHead className="text-right">{t("common.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {profiles.map((profile) => (
            <TableRow key={profile.id} className={muted ? "opacity-70" : undefined}>
              <TableCell className="font-medium text-foreground">
                <div className="flex items-center gap-2.5">
                  <ProfilKindIcon profil={profile} />
                  <span className="truncate">
                    {profile.identifiant || profilFullName(profile)}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {profilFullName(profile)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {profile.email || <NotProvided />}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  <AccessBadges profile={profile} />
                </div>
              </TableCell>
              <TableCell>
                {canManage(profile) && (
                  <ProfileActions
                    profile={profile}
                    currentUserId={currentUserId}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    className="justify-end"
                    compact
                  />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ProfilesCardList({
  profiles,
  currentUserId,
  canManage,
  onEdit,
  onDelete,
  muted,
}: ProfilesListProps) {
  const { t } = useTranslation();
  return (
    <ul className="flex flex-col gap-3 lg:hidden">
      {profiles.map((profile) => {
        const fullName = profilFullName(profile);
        const primary = profile.identifiant || fullName;
        const secondary = fullName !== primary ? fullName : "";
        return (
          <li
            key={profile.id}
            className={cn(
              "flex flex-col gap-3 rounded-xl border border-border bg-card p-3",
              muted && "opacity-70"
            )}
          >
            <div className="flex min-w-0 items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-3">
                <ProfilKindIcon profil={profile} className="size-9" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {primary}
                  </p>
                  {secondary && (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {secondary}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap justify-end gap-1">
                <AccessBadges profile={profile} />
              </div>
            </div>

            <dl className="text-xs">
              <dt className="text-muted-foreground">{t("common.email")}</dt>
              <dd className="truncate text-foreground">
                {profile.email || <NotProvided />}
              </dd>
            </dl>

            {canManage(profile) && (
              <ProfileActions
                profile={profile}
                currentUserId={currentUserId}
                onEdit={onEdit}
                onDelete={onDelete}
                className="justify-end border-t border-border pt-2"
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}
