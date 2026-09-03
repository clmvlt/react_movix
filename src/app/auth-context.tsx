import {
  Fragment,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient, type Query } from "@tanstack/react-query";
import { hasSession, onUnauthorized } from "@/lib/auth";
import {
  clearSelectedAccountId,
  getSelectedAccountId,
  onNoAccountAccess,
  setSelectedAccountId,
  storedAccountIdFor,
} from "@/lib/account-selection";
import {
  applyMembership,
  authKeys,
  useMe,
  webMemberships,
  type AccountMembership,
  type ProfilAuth,
} from "@/features/auth";

interface AuthContextValue {
  user: ProfilAuth | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  accounts: AccountMembership[];
  selectedAccountId: string | null;
  switchAccount: (accountId: string) => void;
  registerMembership: (membership: AccountMembership) => void;
  applyNewMembership: (membership: AccountMembership) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function isDataQuery(query: Query): boolean {
  return query.queryKey[0] !== authKeys.all[0];
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const meQuery = useMe();
  const [selection, setSelection] = useState<string | null>(() =>
    getSelectedAccountId()
  );

  const identity = meQuery.data ?? null;
  const memberships = useMemo(() => webMemberships(identity), [identity]);

  const dropDataCache = useCallback(() => {
    void queryClient.cancelQueries({ predicate: isDataQuery });
    queryClient.removeQueries({ predicate: isDataQuery });
  }, [queryClient]);

  const applySelection = useCallback(
    (accountId: string, userId: string) => {
      setSelectedAccountId(accountId, userId);
      setSelection(accountId);
      dropDataCache();
      void queryClient.invalidateQueries({ queryKey: authKeys.me() });
    },
    [dropDataCache, queryClient]
  );

  useEffect(() => {
    if (!identity) {
      if (!hasSession() && selection !== null) {
        clearSelectedAccountId();
        setSelection(null);
      }
      return;
    }
    if (!identity.userId || memberships.length === 0) {
      if (selection !== null || getSelectedAccountId() !== null) {
        clearSelectedAccountId();
        setSelection(null);
      }
      return;
    }
    const valid = (id: string | null | undefined) =>
      id && memberships.some((m) => m.account.id === id) ? id : null;
    const resolved =
      valid(selection) ??
      valid(storedAccountIdFor(identity.userId)) ??
      valid(identity.account?.id) ??
      memberships[0].account.id;
    if (resolved !== selection) {
      applySelection(resolved, identity.userId);
    } else if (getSelectedAccountId() !== resolved) {
      setSelectedAccountId(resolved, identity.userId);
    }
  }, [identity, memberships, selection, applySelection]);

  useEffect(() => {
    return onNoAccountAccess(() => {
      if (getSelectedAccountId() === null) return;
      clearSelectedAccountId();
      setSelection(null);
      dropDataCache();
      void queryClient.resetQueries({ queryKey: authKeys.all });
    });
  }, [dropDataCache, queryClient]);

  useEffect(() => {
    return onUnauthorized(() => {
      setSelection(null);
      queryClient.removeQueries({ queryKey: authKeys.all });
      navigate("/login", { replace: true });
    });
  }, [navigate, queryClient]);

  const switchAccount = useCallback(
    (accountId: string) => {
      if (!identity?.userId || accountId === selection) return;
      if (!memberships.some((m) => m.account.id === accountId)) return;
      applySelection(accountId, identity.userId);
    },
    [identity, memberships, selection, applySelection]
  );

  const registerMembership = useCallback(
    (membership: AccountMembership) => {
      const current = queryClient.getQueryData<ProfilAuth>(authKeys.me());
      if (!current?.userId) return;
      const others = (current.accounts ?? []).filter(
        (m) => m.account.id !== membership.account.id
      );
      queryClient.setQueryData<ProfilAuth>(authKeys.me(), {
        ...current,
        accounts: [...others, membership],
      });
    },
    [queryClient]
  );

  const applyNewMembership = useCallback(
    (membership: AccountMembership) => {
      registerMembership(membership);
      const current = queryClient.getQueryData<ProfilAuth>(authKeys.me());
      if (!current?.userId) return;
      applySelection(membership.account.id, current.userId);
    },
    [registerMembership, queryClient, applySelection]
  );

  const user = useMemo(() => {
    if (!identity) return null;
    if (!identity.userId || memberships.length === 0) return identity;
    const membership = memberships.find((m) => m.account.id === selection);
    return membership ? applyMembership(identity, membership) : null;
  }, [identity, memberships, selection]);

  const value = useMemo<AuthContextValue>(() => {
    const settling = Boolean(identity) && !user;
    return {
      user,
      isAuthenticated: Boolean(user),
      isLoading: (hasSession() && meQuery.isLoading) || settling,
      accounts: memberships,
      selectedAccountId: selection,
      switchAccount,
      registerMembership,
      applyNewMembership,
    };
  }, [
    identity,
    user,
    meQuery.isLoading,
    memberships,
    selection,
    switchAccount,
    registerMembership,
    applyNewMembership,
  ]);

  return (
    <AuthContext.Provider value={value}>
      <Fragment key={selection ?? "default"}>{children}</Fragment>
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
