import type { ReactNode } from "react";
import { ShieldAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import { EmptyState } from "@/components/states";
import { useAuth } from "@/app/auth-context";

export function useIsAdmin(): boolean {
  const { user } = useAuth();
  return user?.isAdmin === true;
}

export function useIsHyperadmin(): boolean {
  const { user } = useAuth();
  return user?.hyperadmin === true;
}

export function HyperadminGate({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const isHyperadmin = useIsHyperadmin();

  if (!isHyperadmin) {
    return (
      <EmptyState
        message={t("errors.hyperadminOnly")}
        icon={<ShieldAlert className="size-8" />}
        className="flex-1"
      />
    );
  }

  return <>{children}</>;
}

export function AdminGate({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const isAdmin = useIsAdmin();

  if (!isAdmin) {
    return (
      <EmptyState
        message={t("errors.adminOnly")}
        icon={<ShieldAlert className="size-8" />}
        className="flex-1"
      />
    );
  }

  return <>{children}</>;
}
