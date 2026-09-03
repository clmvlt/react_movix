import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/form-field";
import { ColorPicker } from "@/components/color-picker";
import { useToast } from "@/app/toast-context";
import { defaultCategoryColor, safeCategoryColor } from "@/lib/colors";
import {
  useCreateTodoCategory,
  useDeleteTodoCategory,
  useUpdateTodoCategory,
  type Todo,
  type TodoCategory,
} from "@/features/todos";

const NAME_MAX = 40;

interface TodoCategoriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: TodoCategory[];
  todos: Todo[];
  initialEdit: TodoCategory | null;
}

type Editing = TodoCategory | "new" | null;

export function TodoCategoriesDialog({
  open,
  onOpenChange,
  categories,
  todos,
  initialEdit,
}: TodoCategoriesDialogProps) {
  const { t } = useTranslation();
  const createCategory = useCreateTodoCategory();
  const updateCategory = useUpdateTodoCategory();
  const deleteCategory = useDeleteTodoCategory();
  const toast = useToast();

  const [editing, setEditing] = useState<Editing>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(defaultCategoryColor);
  const [nameError, setNameError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TodoCategory | null>(null);

  useEffect(() => {
    if (!open) return;
    setEditing(initialEdit);
    setName(initialEdit?.name ?? "");
    setColor(safeCategoryColor(initialEdit?.color));
    setNameError(null);
    setDeleteTarget(null);
  }, [open, initialEdit]);

  const pending = createCategory.isPending || updateCategory.isPending;
  const attached = deleteTarget
    ? todos.filter((todo) => todo.category?.id === deleteTarget.id)
    : [];

  const startCreate = () => {
    setEditing("new");
    setName("");
    setColor(defaultCategoryColor);
    setNameError(null);
  };

  const startEdit = (category: TodoCategory) => {
    setEditing(category);
    setName(category.name ?? "");
    setColor(safeCategoryColor(category.color));
    setNameError(null);
  };

  const cancelEdit = () => {
    setEditing(null);
    setNameError(null);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setNameError(null);

    const trimmed = name.trim();
    if (!trimmed) {
      setNameError(t("todos.categories.nameRequired"));
      return;
    }
    if (trimmed.length > NAME_MAX) {
      setNameError(t("todos.categories.nameTooLong", { max: NAME_MAX }));
      return;
    }

    const editingId = editing && editing !== "new" ? editing.id : null;
    const duplicate = categories.some(
      (category) =>
        category.id !== editingId &&
        (category.name ?? "").trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (duplicate) {
      setNameError(t("todos.categories.duplicate"));
      return;
    }

    const input = { name: trimmed, color };
    const onError = () => toast.error(t("todos.errors.save"));
    const onSuccess = () => cancelEdit();

    if (editingId !== null) {
      updateCategory.mutate({ id: editingId, input }, { onSuccess, onError });
    } else {
      createCategory.mutate(input, { onSuccess, onError });
    }
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteCategory.mutate(
      { id: deleteTarget.id, attached },
      {
        onSuccess: () => setDeleteTarget(null),
        onError: () => toast.error(t("todos.errors.deleteCategory")),
        onSettled: () => setDeleteTarget(null),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("todos.categories.title")}</DialogTitle>
          <DialogDescription>
            {t("todos.categories.subtitle")}
          </DialogDescription>
        </DialogHeader>

        {deleteTarget ? (
          <div className="flex flex-col gap-4">
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm font-medium text-foreground">
                {t("todos.categories.delete.confirm", {
                  name:
                    deleteTarget.name?.trim() ||
                    t("todos.categories.untitled"),
                })}
              </p>
              {attached.length > 0 && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("todos.categories.delete.detach", {
                    count: attached.length,
                  })}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteTarget(null)}
                disabled={deleteCategory.isPending}
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={confirmDelete}
                disabled={deleteCategory.isPending}
              >
                {deleteCategory.isPending && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                {t("common.delete")}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <ul className="flex flex-col gap-2">
              {categories.length === 0 && (
                <li className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
                  {t("todos.categories.empty")}
                </li>
              )}
              {categories.map((category) => {
                const count = todos.filter(
                  (todo) => todo.category?.id === category.id
                ).length;
                return (
                  <li
                    key={category.id}
                    className="flex items-center gap-3 rounded-lg border border-border px-3 py-2"
                  >
                    <span
                      aria-hidden="true"
                      className="size-3 shrink-0 rounded-full"
                      style={{
                        backgroundColor: safeCategoryColor(category.color),
                      }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {category.name?.trim() ||
                          t("todos.categories.untitled")}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {t("todos.categories.todoCount", { count })}
                      </span>
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0"
                      onClick={() => startEdit(category)}
                      aria-label={t("common.edit")}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0"
                      onClick={() => setDeleteTarget(category)}
                      aria-label={t("common.delete")}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </li>
                );
              })}
            </ul>

            {editing ? (
              <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-1 rounded-lg border border-border p-4"
                noValidate
              >
                <FormField
                  label={t("todos.categories.name")}
                  htmlFor="tc-name"
                  error={nameError ?? undefined}
                  required
                >
                  <Input
                    id="tc-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("todos.categories.namePlaceholder")}
                    maxLength={NAME_MAX}
                    autoComplete="off"
                  />
                </FormField>

                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium leading-none text-foreground">
                    {t("todos.categories.color")}
                  </span>
                  <ColorPicker
                    value={color}
                    onChange={setColor}
                    label={t("todos.categories.color")}
                  />
                </div>

                <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={cancelEdit}
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button type="submit" disabled={pending}>
                    {pending && <Loader2 className="size-4 animate-spin" />}
                    {t("common.save")}
                  </Button>
                </div>
              </form>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={startCreate}
                className="w-full"
              >
                <Plus className="size-4" />
                {t("todos.categories.add")}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
