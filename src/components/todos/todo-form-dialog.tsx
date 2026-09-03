import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Check, Loader2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FormField } from "@/components/form-field";
import { useToast } from "@/app/toast-context";
import { cn } from "@/lib/utils";
import { safeCategoryColor } from "@/lib/colors";
import {
  useCreateTodo,
  useUpdateTodo,
  type Todo,
  type TodoCategory,
} from "@/features/todos";

const TITLE_MAX = 120;
const DESCRIPTION_MAX = 2000;

interface TodoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  todo: Todo | null;
  categories: TodoCategory[];
  defaultCategoryId: number | null;
}

interface FormState {
  title: string;
  description: string;
  completed: boolean;
  categoryId: number | null;
}

function initialState(
  todo: Todo | null,
  defaultCategoryId: number | null
): FormState {
  return {
    title: todo?.title ?? "",
    description: todo?.description ?? "",
    completed: todo?.completed ?? false,
    categoryId: todo ? (todo.category?.id ?? null) : defaultCategoryId,
  };
}

function chipClass(active: boolean): string {
  return cn(
    "inline-flex min-h-9 items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
    active
      ? "border-primary bg-accent text-accent-foreground"
      : "border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
  );
}

export function TodoFormDialog({
  open,
  onOpenChange,
  todo,
  categories,
  defaultCategoryId,
}: TodoFormDialogProps) {
  const { t } = useTranslation();
  const isEdit = Boolean(todo);
  const createTodo = useCreateTodo();
  const updateTodo = useUpdateTodo();
  const toast = useToast();

  const [form, setForm] = useState<FormState>(() =>
    initialState(todo, defaultCategoryId)
  );
  const [titleError, setTitleError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(initialState(todo, defaultCategoryId));
      setTitleError(null);
    }
  }, [open, todo, defaultCategoryId]);

  const pending = createTodo.isPending || updateTodo.isPending;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setTitleError(null);

    const title = form.title.trim();
    if (!title) {
      setTitleError(t("todos.form.titleRequired"));
      return;
    }
    if (title.length > TITLE_MAX) {
      setTitleError(t("todos.form.titleTooLong", { max: TITLE_MAX }));
      return;
    }

    const input = {
      title,
      description: form.description.trim(),
      completed: form.completed,
      category: form.categoryId === null ? null : { id: form.categoryId },
    };

    const onError = () => toast.error(t("todos.errors.save"));
    const onSuccess = () => onOpenChange(false);

    if (isEdit && todo) {
      updateTodo.mutate({ todo, input }, { onSuccess, onError });
    } else {
      createTodo.mutate(input, { onSuccess, onError });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("todos.form.editTitle") : t("todos.form.createTitle")}
          </DialogTitle>
          <DialogDescription>{t("todos.form.subtitle")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-1" noValidate>
          <FormField
            label={t("todos.form.titleLabel")}
            htmlFor="td-title"
            error={titleError ?? undefined}
            required
          >
            <Input
              id="td-title"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder={t("todos.form.titlePlaceholder")}
              maxLength={TITLE_MAX}
              autoComplete="off"
            />
          </FormField>

          <FormField
            label={t("todos.form.description")}
            htmlFor="td-description"
          >
            <Textarea
              id="td-description"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder={t("todos.form.descriptionPlaceholder")}
              maxLength={DESCRIPTION_MAX}
              rows={4}
            />
          </FormField>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium leading-none text-foreground">
              {t("todos.form.category")}
            </span>
            <div
              role="group"
              aria-label={t("todos.form.category")}
              className="flex flex-wrap gap-2"
            >
              <button
                type="button"
                onClick={() => set("categoryId", null)}
                className={chipClass(form.categoryId === null)}
                aria-pressed={form.categoryId === null}
              >
                {form.categoryId === null && <Check className="size-3.5" />}
                {t("todos.uncategorized")}
              </button>
              {categories.map((category) => {
                const active = form.categoryId === category.id;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => set("categoryId", category.id)}
                    className={chipClass(active)}
                    aria-pressed={active}
                  >
                    <span
                      aria-hidden="true"
                      className="size-2.5 shrink-0 rounded-full"
                      style={{
                        backgroundColor: safeCategoryColor(category.color),
                      }}
                    />
                    <span className="max-w-40 truncate">
                      {category.name?.trim() || t("todos.categories.untitled")}
                    </span>
                  </button>
                );
              })}
            </div>
            {categories.length === 0 && (
              <p className="text-xs text-muted-foreground">
                {t("todos.form.noCategory")}
              </p>
            )}
          </div>

          <label
            htmlFor="td-completed"
            className="mt-4 flex items-center gap-2"
          >
            <Checkbox
              id="td-completed"
              checked={form.completed}
              onCheckedChange={(value) => set("completed", value === true)}
            />
            <Label htmlFor="td-completed" className="font-normal">
              {t("todos.form.completed")}
            </Label>
          </label>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
