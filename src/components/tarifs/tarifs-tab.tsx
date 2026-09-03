import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Euro, Pencil, Plus, Trash2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EmptyState, LoadingState } from "@/components/states";
import { useApiErrorMessage } from "@/components/account/use-account-error";
import { useTarifs, type Tarif } from "@/features/tarifs";
import { hasPriceInversion } from "./tarif-form";
import { TarifFormDialog } from "./tarif-form-dialog";
import { TarifDeleteDialog } from "./tarif-delete-dialog";
import { TarifSimulator } from "./tarif-simulator";

export function TarifsTab() {
  const { t } = useTranslation();
  const tarifsQuery = useTarifs();
  const errorMessage = useApiErrorMessage("tarifs");

  const [editing, setEditing] = useState<Tarif | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Tarif | null>(null);

  const tarifs = tarifsQuery.data ?? [];

  const renderList = () => {
    if (tarifsQuery.isLoading) return <LoadingState />;
    if (tarifsQuery.isError) {
      return (
        <Alert variant="warning">
          <AlertDescription>
            {errorMessage(tarifsQuery.error, "tarifs.errors.loadFailed")}
          </AlertDescription>
        </Alert>
      );
    }
    if (tarifs.length === 0) {
      return (
        <EmptyState
          message={t("tarifs.empty")}
          icon={<Euro className="size-8" />}
        />
      );
    }

    return (
      <ul className="flex flex-col gap-2">
        {tarifs.map((tarif) => (
          <li
            key={tarif.id}
            className="flex items-center gap-2 rounded-xl border border-border bg-card p-3"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {t("tarifs.upTo", { km: tarif.kmMax })}
              </p>
              <p className="text-sm text-muted-foreground tabular-nums">
                {t("tarifs.priceValue", { price: tarif.prixEuro })}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-11 shrink-0 lg:size-8"
              aria-label={t("common.edit")}
              onClick={() => setEditing(tarif)}
            >
              <Pencil className="size-5 lg:size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-11 shrink-0 lg:size-8"
              aria-label={t("common.delete")}
              onClick={() => setDeleting(tarif)}
            >
              <Trash2 className="size-5 text-destructive lg:size-4" />
            </Button>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="grid auto-rows-min grid-cols-1 gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-base">{t("tarifs.title")}</CardTitle>
            <CardDescription>{t("tarifs.subtitle")}</CardDescription>
          </div>
          <Button
            type="button"
            className="min-h-11 shrink-0 lg:min-h-10"
            onClick={() => setCreating(true)}
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">{t("tarifs.create")}</span>
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {hasPriceInversion(tarifs) && (
            <Alert variant="warning">
              <AlertDescription>{t("tarifs.priceInversion")}</AlertDescription>
            </Alert>
          )}
          {renderList()}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("tarifs.rule.title")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              {t("tarifs.rule.body")}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("tarifs.rule.noMatch")}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("tarifs.rule.depotNotice")}
            </p>
          </CardContent>
        </Card>

        <TarifSimulator tarifs={tarifs} />
      </div>

      <TarifFormDialog
        open={creating || Boolean(editing)}
        onOpenChange={(open) => {
          if (open) return;
          setCreating(false);
          setEditing(null);
        }}
        tarif={editing}
        tarifs={tarifs}
      />
      <TarifDeleteDialog
        tarif={deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      />
    </div>
  );
}
