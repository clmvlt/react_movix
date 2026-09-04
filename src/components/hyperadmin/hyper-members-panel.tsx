import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeftRight,
  Check,
  Loader2,
  LogIn,
  Pencil,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormField } from "@/components/form-field";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { ProfilKindIcon } from "@/components/profiles/profil-kind-icon";
import { AccountPicker } from "@/components/hyperadmin/account-picker";
import { useHyperError } from "@/components/hyperadmin/use-hyper-error";
import { useAuth } from "@/app/auth-context";
import { useToast } from "@/app/toast-context";
import { ApiError } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import {
  authKeys,
  profilFullName,
  type Account,
  type Profil,
} from "@/features/auth";
import {
  useAccountMembers,
  useAddAccountMember,
  useRemoveAccountMember,
  useUpdateAccountMember,
} from "@/features/members";

const MEMBER_FLAGS = [
  ["isAdmin", "profiles.access.admin"],
  ["isWeb", "profiles.access.web"],
  ["isMobile", "profiles.access.mobile"],
  ["isStock", "profiles.access.stock"],
  ["isActive", "profiles.access.active"],
] as const;

type MemberFlag = (typeof MEMBER_FLAGS)[number][0];
type MemberFlagsState = Record<MemberFlag, boolean>;

function memberFlags(member: Profil | null): MemberFlagsState {
  return {
    isAdmin: member?.isAdmin === true,
    isWeb: member?.isWeb === true,
    isMobile: member?.isMobile === true,
    isStock: member?.isStock === true,
    isActive: member?.isActive === true,
  };
}

function memberPrimaryName(member: Profil | null): string {
  if (!member) return "";
  return (
    member.identifiant || profilFullName(member) || member.email || ""
  );
}

export function HyperMembersPanel() {
  const { t } = useTranslation();
  const [account, setAccount] = useState<Account | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-1.5 p-4">
          <Label htmlFor="hyper-members-account">
            {t("hyperadmin.members.accountLabel")}
          </Label>
          <AccountPicker
            id="hyper-members-account"
            value={account}
            onChange={setAccount}
          />
          {!account && (
            <p className="text-xs text-muted-foreground">
              {t("hyperadmin.members.selectAccount")}
            </p>
          )}
        </CardContent>
      </Card>

      {account && (
        <>
          <JoinCard key={`join-${account.id}`} account={account} />
          <MembersCard key={`members-${account.id}`} account={account} />
        </>
      )}
    </div>
  );
}

function JoinCard({ account }: { account: Account }) {
  const { t } = useTranslation();
  const toast = useToast();
  const errorMessage = useHyperError();
  const queryClient = useQueryClient();
  const { accounts, selectedAccountId, switchAccount, registerMembership } =
    useAuth();
  const addMember = useAddAccountMember();
  const [asAdmin, setAsAdmin] = useState(true);

  const isMember = accounts.some((m) => m.account.id === account.id);
  const isCurrent = selectedAccountId === account.id;

  const handleJoin = () => {
    addMember.mutate(
      { accountId: account.id, input: asAdmin ? { isAdmin: true } : {} },
      {
        onSuccess: (membership) => {
          registerMembership(membership);
          void queryClient.invalidateQueries({ queryKey: authKeys.me() });
          toast.success(
            t("hyperadmin.members.joined", { account: account.societe })
          );
        },
        onError: (err) => {
          if (err instanceof ApiError && err.status === 409) {
            void queryClient.invalidateQueries({ queryKey: authKeys.me() });
            toast.warning(t("hyperadmin.members.alreadyMember"));
          } else {
            toast.error(errorMessage(err));
          }
        },
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {t("hyperadmin.members.joinTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {isCurrent ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Check className="size-4 shrink-0 text-primary" />
            {t("hyperadmin.members.current")}
          </p>
        ) : isMember ? (
          <>
            <p className="text-sm text-muted-foreground">
              {t("hyperadmin.members.memberHint")}
            </p>
            <Button
              type="button"
              className="min-h-11 w-full sm:w-fit lg:min-h-10"
              onClick={() => switchAccount(account.id)}
            >
              <ArrowLeftRight className="size-4" />
              {t("hyperadmin.members.switchAction", {
                account: account.societe,
              })}
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {t("hyperadmin.members.joinHint")}
            </p>
            <label
              htmlFor="hyper-join-admin"
              className="flex min-h-11 w-fit items-center gap-3 rounded-xl border border-border bg-card px-3 py-2 lg:min-h-10"
            >
              <Checkbox
                id="hyper-join-admin"
                checked={asAdmin}
                onCheckedChange={(v) => setAsAdmin(v === true)}
              />
              <Label htmlFor="hyper-join-admin" className="font-normal">
                {t("hyperadmin.members.joinAsAdmin")}
              </Label>
            </label>
            <Button
              type="button"
              className="min-h-11 w-full sm:w-fit lg:min-h-10"
              disabled={addMember.isPending}
              onClick={handleJoin}
            >
              {addMember.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <LogIn className="size-4" />
              )}
              {t("hyperadmin.members.joinAction")}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function MembersCard({ account }: { account: Account }) {
  const { t } = useTranslation();
  const toast = useToast();
  const errorMessage = useHyperError();
  const membersQuery = useAccountMembers(account.id);
  const addMember = useAddAccountMember();
  const removeMember = useRemoveAccountMember();

  const [email, setEmail] = useState("");
  const [addAsAdmin, setAddAsAdmin] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<Profil | null>(null);
  const [editTarget, setEditTarget] = useState<Profil | null>(null);

  const handleAdd = (event: FormEvent) => {
    event.preventDefault();
    setEmailError(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError(t("hyperadmin.members.emailRequired"));
      return;
    }
    addMember.mutate(
      { accountId: account.id, input: { email: trimmed, isAdmin: addAsAdmin } },
      {
        onSuccess: () => {
          setEmail("");
          setAddAsAdmin(false);
          toast.success(
            t("hyperadmin.members.added", { email: trimmed })
          );
        },
        onError: (err) => {
          if (err instanceof ApiError && err.status === 404) {
            setEmailError(t("hyperadmin.members.noUser"));
          } else if (err instanceof ApiError && err.status === 409) {
            setEmailError(t("hyperadmin.members.userAlreadyMember"));
          } else {
            toast.error(errorMessage(err));
          }
        },
      }
    );
  };

  const removalLinked = Boolean(removeTarget?.userId);
  const removalName = removeTarget
    ? removeTarget.identifiant ||
      profilFullName(removeTarget) ||
      removeTarget.email ||
      ""
    : "";

  const confirmRemove = () => {
    if (!removeTarget) return;
    removeMember.mutate(
      { accountId: account.id, profilId: removeTarget.id },
      {
        onSuccess: () => {
          setRemoveTarget(null);
          toast.success(t("hyperadmin.members.removed"));
        },
        onError: (err) => {
          setRemoveTarget(null);
          toast.error(errorMessage(err));
        },
      }
    );
  };

  const members = [...(membersQuery.data ?? [])].sort(
    (a, b) => Number(Boolean(b.userId)) - Number(Boolean(a.userId))
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {t("hyperadmin.members.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form
          onSubmit={handleAdd}
          className="flex flex-col gap-2 rounded-xl border border-border bg-muted/50 p-3"
          noValidate
        >
          <p className="text-xs font-medium uppercase text-muted-foreground">
            {t("hyperadmin.members.addTitle")}
          </p>
          <FormField
            label={t("common.email")}
            htmlFor="hyper-add-email"
            error={emailError ?? undefined}
          >
            <Input
              id="hyper-add-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError(null);
              }}
              autoComplete="off"
              className="min-h-11 bg-background lg:min-h-10"
            />
          </FormField>
          <div className="flex flex-wrap items-center gap-2">
            <label
              htmlFor="hyper-add-admin"
              className="flex min-h-11 items-center gap-3 rounded-xl border border-border bg-background px-3 py-2 lg:min-h-10"
            >
              <Checkbox
                id="hyper-add-admin"
                checked={addAsAdmin}
                onCheckedChange={(v) => setAddAsAdmin(v === true)}
              />
              <Label htmlFor="hyper-add-admin" className="font-normal">
                {t("profiles.access.admin")}
              </Label>
            </label>
            <Button
              type="submit"
              className="min-h-11 lg:min-h-10"
              disabled={addMember.isPending}
            >
              {addMember.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <UserPlus className="size-4" />
              )}
              {t("hyperadmin.members.addAction")}
            </Button>
          </div>
        </form>

        {membersQuery.isLoading ? (
          <LoadingState />
        ) : membersQuery.isError ? (
          <ErrorState
            error={membersQuery.error}
            retrying={membersQuery.isFetching}
            onRetry={() => void membersQuery.refetch()}
          />
        ) : members.length === 0 ? (
          <EmptyState
            message={t("hyperadmin.members.empty")}
            icon={<Users className="size-6" />}
            className="py-6"
          />
        ) : (
          <ul className="flex min-w-0 flex-col gap-3">
            {members.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                onEdit={() => setEditTarget(member)}
                onRemove={() => setRemoveTarget(member)}
              />
            ))}
          </ul>
        )}
      </CardContent>

      <MemberEditDialog
        accountId={account.id}
        member={editTarget}
        onClose={() => setEditTarget(null)}
      />

      <Dialog
        open={Boolean(removeTarget)}
        onOpenChange={(open) => {
          if (!open && !removeMember.isPending) setRemoveTarget(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("hyperadmin.members.removeTitle")}</DialogTitle>
            <DialogDescription>
              {removalLinked
                ? t("hyperadmin.members.removeConfirmLinked", {
                    name: removalName,
                    account: account.societe,
                  })
                : t("hyperadmin.members.removeConfirm", {
                    name: removalName,
                    account: account.societe,
                  })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 sm:min-h-10"
              onClick={() => setRemoveTarget(null)}
              disabled={removeMember.isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="min-h-11 sm:min-h-10"
              onClick={confirmRemove}
              disabled={removeMember.isPending}
            >
              {removeMember.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              {t("hyperadmin.members.removeAction")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function MemberRow({
  member,
  onEdit,
  onRemove,
}: {
  member: Profil;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation();

  const fullName = profilFullName(member);
  const primary = memberPrimaryName(member);
  const secondary = [fullName, member.email]
    .filter((part): part is string => Boolean(part) && part !== primary)
    .join(" · ");

  return (
    <li
      className={cn(
        "flex flex-col gap-2 rounded-xl border border-border bg-card p-3",
        !member.isActive && "opacity-70"
      )}
    >
      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <ProfilKindIcon profil={member} className="size-9" />
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
        <div className="flex shrink-0 items-center gap-1">
          {member.userId && (
            <Badge variant="secondary">{t("profiles.linkedBadge")}</Badge>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11 shrink-0 lg:size-8"
            onClick={onEdit}
            aria-label={t("common.edit")}
            title={t("common.edit")}
          >
            <Pencil className="size-5 lg:size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11 shrink-0 lg:size-8"
            onClick={onRemove}
            aria-label={t("hyperadmin.members.removeAction")}
            title={t("hyperadmin.members.removeAction")}
          >
            <Trash2 className="size-5 text-destructive lg:size-4" />
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1 border-t border-border pt-2">
        {member.isAdmin && (
          <Badge variant="secondary">{t("profiles.access.admin")}</Badge>
        )}
        {member.isWeb && (
          <Badge variant="outline">{t("profiles.access.web")}</Badge>
        )}
        {member.isMobile && (
          <Badge variant="outline">{t("profiles.access.mobile")}</Badge>
        )}
        {member.isStock && (
          <Badge variant="outline">{t("profiles.access.stock")}</Badge>
        )}
        {!member.isActive && (
          <Badge variant="outline">{t("profiles.access.inactive")}</Badge>
        )}
      </div>
    </li>
  );
}

function MemberEditDialog({
  accountId,
  member,
  onClose,
}: {
  accountId: string;
  member: Profil | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const toast = useToast();
  const errorMessage = useHyperError();
  const updateMember = useUpdateAccountMember();

  const [form, setForm] = useState<MemberFlagsState>(() => memberFlags(member));

  useEffect(() => {
    if (member) setForm(memberFlags(member));
  }, [member]);

  const baseline = memberFlags(member);
  const dirty = MEMBER_FLAGS.some(([flag]) => form[flag] !== baseline[flag]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!member) return;
    const patch: Partial<MemberFlagsState> = {};
    for (const [flag] of MEMBER_FLAGS) {
      if (form[flag] !== baseline[flag]) patch[flag] = form[flag];
    }
    if (Object.keys(patch).length === 0) {
      onClose();
      return;
    }
    updateMember.mutate(
      { accountId, profilId: member.id, input: patch },
      {
        onSuccess: () => {
          onClose();
          toast.success(t("hyperadmin.members.updated"));
        },
        onError: (err) => {
          toast.error(errorMessage(err));
        },
      }
    );
  };

  return (
    <Dialog
      open={Boolean(member)}
      onOpenChange={(open) => {
        if (!open && !updateMember.isPending) onClose();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("hyperadmin.members.editTitle")}</DialogTitle>
          <DialogDescription>{memberPrimaryName(member)}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-1" noValidate>
          <div className="grid grid-cols-2 gap-2">
            {MEMBER_FLAGS.map(([flag, labelKey]) => (
              <label
                key={flag}
                htmlFor={`member-edit-${flag}`}
                className="flex min-h-11 items-center gap-3 rounded-xl border border-border bg-card px-3 py-2 lg:min-h-10"
              >
                <Checkbox
                  id={`member-edit-${flag}`}
                  checked={form[flag]}
                  onCheckedChange={(v) =>
                    setForm((prev) => ({ ...prev, [flag]: v === true }))
                  }
                />
                <Label htmlFor={`member-edit-${flag}`} className="font-normal">
                  {t(labelKey)}
                </Label>
              </label>
            ))}
          </div>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              className="min-h-11 sm:min-h-10"
              onClick={onClose}
              disabled={updateMember.isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              className="min-h-11 sm:min-h-10"
              disabled={!dirty || updateMember.isPending}
            >
              {updateMember.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              {t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
