import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  Palette,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EmptyState, LoadingState } from "@/components/states";
import { ColorPicker } from "@/components/color-picker";
import { ApiError, apiErrorText } from "@/lib/api-error";
import { defaultCategoryColor, normalizeHexColor } from "@/lib/colors";
import { useToast } from "@/app/toast-context";
import {
  useAccountColors,
  useCreateAccountColor,
  useReorderAccountColors,
  useUpdateAccountColor,
  type AccountColor,
  type AccountColorUpdateInput,
} from "@/features/account-colors";
import { AccountColorDeleteDialog } from "./account-color-delete-dialog";

function useAccountColorErrorMessage() {
  const { t } = useTranslation();
  return (error: unknown, fallbackKey: string): string => {
    if (error instanceof ApiError) {
      if (error.status === 409) return t("accountColors.errors.duplicate");
      if (error.status === 400) return t("accountColors.errors.invalidFormat");
      if (error.status === 403) return t("accountColors.errors.forbidden");
      const text = apiErrorText(error);
      if (text) return text;
    }
    return t(fallbackKey);
  };
}

export function AccountColorsTab() {
  const { t } = useTranslation();
  const toast = useToast();
  const errorMessage = useAccountColorErrorMessage();
  const colorsQuery = useAccountColors();
  const createColor = useCreateAccountColor();
  const reorderColors = useReorderAccountColors();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<AccountColor | null>(null);
  const [newColor, setNewColor] = useState<string>(defaultCategoryColor);
  const [newName, setNewName] = useState("");
  const [addError, setAddError] = useState<string | null>(null);

  const colors = colorsQuery.data ?? [];

  const handleAdd = (event: React.FormEvent) => {
    event.preventDefault();
    const normalized = normalizeHexColor(newColor);
    if (!normalized) {
      setAddError(t("accountColors.errors.invalidFormat"));
      return;
    }
    setAddError(null);
    const name = newName.trim();
    createColor.mutate(
      { color: normalized, ...(name ? { name } : {}) },
      {
        onSuccess: () => setNewName(""),
        onError: (error) =>
          setAddError(errorMessage(error, "accountColors.errors.saveFailed")),
      }
    );
  };

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= colors.length) return;
    const next = [...colors];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    const entries = next
      .map((entry, position) => ({ id: entry.id, displayOrder: position + 1 }))
      .filter(
        (entry, position) => next[position].displayOrder !== entry.displayOrder
      );
    if (entries.length === 0) return;
    reorderColors.mutate(entries, {
      onError: (error) =>
        toast.error(errorMessage(error, "accountColors.errors.saveFailed")),
    });
  };

  const renderList = () => {
    if (colorsQuery.isLoading) return <LoadingState />;
    if (colorsQuery.isError) {
      return (
        <Alert variant="warning">
          <AlertDescription>
            {errorMessage(colorsQuery.error, "accountColors.errors.loadFailed")}
          </AlertDescription>
        </Alert>
      );
    }
    if (colors.length === 0) {
      return (
        <EmptyState
          message={t("accountColors.empty")}
          icon={<Palette className="size-8" />}
        />
      );
    }

    return (
      <ul className="flex flex-col gap-2">
        {colors.map((color, index) =>
          editingId === color.id ? (
            <AccountColorEditRow
              key={color.id}
              color={color}
              onClose={() => setEditingId(null)}
            />
          ) : (
            <li
              key={color.id}
              className="flex items-center gap-1 rounded-xl border border-border bg-card p-2 lg:gap-2 lg:p-3"
            >
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-11 shrink-0 lg:size-8"
                disabled={index === 0 || reorderColors.isPending}
                onClick={() => move(index, -1)}
                aria-label={t("accountColors.moveUp")}
              >
                <ChevronUp className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-11 shrink-0 lg:size-8"
                disabled={index === colors.length - 1 || reorderColors.isPending}
                onClick={() => move(index, 1)}
                aria-label={t("accountColors.moveDown")}
              >
                <ChevronDown className="size-4" />
              </Button>
              <span
                className="size-6 shrink-0 rounded-full border border-border"
                style={{ backgroundColor: color.color }}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {color.name || t("accountColors.unnamed")}
                </p>
                <p className="text-xs uppercase text-muted-foreground">
                  {color.color}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-11 shrink-0 lg:size-8"
                aria-label={t("common.edit")}
                onClick={() => setEditingId(color.id)}
              >
                <Pencil className="size-5 lg:size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-11 shrink-0 lg:size-8"
                aria-label={t("common.delete")}
                onClick={() => setDeleting(color)}
              >
                <Trash2 className="size-5 text-destructive lg:size-4" />
              </Button>
            </li>
          )
        )}
      </ul>
    );
  };

  return (
    <div className="grid auto-rows-min grid-cols-1 gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("accountColors.title")}</CardTitle>
          <CardDescription>{t("accountColors.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <form
            onSubmit={handleAdd}
            className="flex flex-col gap-2 rounded-xl border border-border p-3"
          >
            <div className="flex flex-wrap items-center gap-2">
              <ColorPicker
                id="account-color-new"
                value={newColor}
                onChange={setNewColor}
                label={t("accountColors.newColor")}
                swatches={false}
                accountPalette={false}
                disabled={createColor.isPending}
                triggerClassName="size-11 lg:size-8"
              />
              <Input
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                placeholder={t("accountColors.namePlaceholder")}
                aria-label={t("accountColors.name")}
                maxLength={100}
                disabled={createColor.isPending}
                className="min-h-11 w-40 min-w-0 flex-1 lg:min-h-10"
              />
              <Button
                type="submit"
                className="min-h-11 shrink-0 lg:min-h-10"
                disabled={createColor.isPending}
              >
                {createColor.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Plus className="size-4" />
                )}
                <span className="hidden sm:inline">
                  {t("accountColors.add")}
                </span>
              </Button>
            </div>
            {addError && <p className="text-xs text-destructive">{addError}</p>}
          </form>
          {renderList()}
        </CardContent>
      </Card>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-base">
            {t("accountColors.usage.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">
            {t("accountColors.usage.pickers")}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("accountColors.usage.fallback")}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("accountColors.usage.order")}
          </p>
        </CardContent>
      </Card>

      <AccountColorDeleteDialog
        color={deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      />
    </div>
  );
}

function AccountColorEditRow({
  color,
  onClose,
}: {
  color: AccountColor;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const errorMessage = useAccountColorErrorMessage();
  const updateColor = useUpdateAccountColor();

  const [draftColor, setDraftColor] = useState(color.color);
  const [draftName, setDraftName] = useState(color.name ?? "");
  const [draftOrder, setDraftOrder] = useState(
    color.displayOrder == null ? "" : String(color.displayOrder)
  );
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    const normalized = normalizeHexColor(draftColor);
    if (!normalized) {
      setError(t("accountColors.errors.invalidFormat"));
      return;
    }
    const input: AccountColorUpdateInput = {};
    if (normalized.toLowerCase() !== color.color.trim().toLowerCase()) {
      input.color = normalized;
    }
    const name = draftName.trim();
    if (name !== (color.name ?? "")) input.name = name;
    const orderRaw = draftOrder.trim();
    if (orderRaw !== "") {
      const order = Number(orderRaw);
      if (!Number.isInteger(order) || order < 1) {
        setError(t("accountColors.errors.invalidOrder"));
        return;
      }
      if (order !== color.displayOrder) input.displayOrder = order;
    }
    if (Object.keys(input).length === 0) {
      onClose();
      return;
    }
    setError(null);
    updateColor.mutate(
      { id: color.id, input },
      {
        onSuccess: onClose,
        onError: (cause) =>
          setError(errorMessage(cause, "accountColors.errors.saveFailed")),
      }
    );
  };

  return (
    <li className="flex flex-col gap-2 rounded-xl border border-primary bg-card p-3">
      <div className="flex flex-wrap items-center gap-2">
        <ColorPicker
          id={`account-color-${color.id}`}
          value={draftColor}
          onChange={setDraftColor}
          label={t("common.color")}
          swatches={false}
          accountPalette={false}
          disabled={updateColor.isPending}
          triggerClassName="size-11 lg:size-8"
        />
        <Input
          value={draftName}
          onChange={(event) => setDraftName(event.target.value)}
          placeholder={t("accountColors.namePlaceholder")}
          aria-label={t("accountColors.name")}
          maxLength={100}
          disabled={updateColor.isPending}
          className="min-h-11 w-32 min-w-0 flex-1 lg:min-h-10"
        />
        <Input
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
          value={draftOrder}
          onChange={(event) => setDraftOrder(event.target.value)}
          placeholder={t("accountColors.order")}
          aria-label={t("accountColors.order")}
          disabled={updateColor.isPending}
          className="min-h-11 w-20 shrink-0 lg:min-h-10"
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          className="min-h-11 lg:min-h-10"
          onClick={onClose}
          disabled={updateColor.isPending}
        >
          {t("common.cancel")}
        </Button>
        <Button
          type="button"
          className="min-h-11 lg:min-h-10"
          onClick={handleSave}
          disabled={updateColor.isPending}
        >
          {updateColor.isPending && <Loader2 className="size-4 animate-spin" />}
          {t("common.save")}
        </Button>
      </div>
    </li>
  );
}
