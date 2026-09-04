import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ListChecks, Loader2, Plus, Search, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { TodoColumn } from "@/components/todos/todo-column";
import { TodoFormDialog } from "@/components/todos/todo-form-dialog";
import { TodoCategoriesDialog } from "@/components/todos/todo-categories-dialog";
import { cn } from "@/lib/utils";
import { useToast } from "@/app/toast-context";
import {
  matchesTodo,
  sortTodos,
  toTodoInput,
  useDeleteTodo,
  UNCATEGORIZED,
  useTodoCategories,
  useTodos,
  useUpdateTodo,
  type Todo,
  type TodoCategory,
  type TodoFilter,
} from "@/features/todos";

const FILTERS: TodoFilter[] = ["all", "open", "done"];
const DEFAULT_FILTER: TodoFilter = "open";

function isFilter(value: string | null): value is TodoFilter {
  return value === "all" || value === "open" || value === "done";
}

export function TodosPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const rawStatus = searchParams.get("status");
  const status: TodoFilter = isFilter(rawStatus) ? rawStatus : DEFAULT_FILTER;

  const todosQuery = useTodos();
  const categoriesQuery = useTodoCategories();
  const updateTodo = useUpdateTodo();
  const deleteTodo = useDeleteTodo();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Todo | null>(null);
  const [presetCategoryId, setPresetCategoryId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Todo | null>(null);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<TodoCategory | null>(
    null
  );
  const [dragging, setDragging] = useState<Todo | null>(null);
  const [overColumn, setOverColumn] = useState<string | null>(null);
  const toast = useToast();

  const todos = useMemo(() => todosQuery.data ?? [], [todosQuery.data]);
  const categories = useMemo(() => {
    const list = categoriesQuery.data ?? [];
    return [...list].sort((a, b) =>
      (a.name ?? "").localeCompare(b.name ?? "")
    );
  }, [categoriesQuery.data]);

  const counts = useMemo(
    () => ({
      all: todos.length,
      open: todos.filter((todo) => !todo.completed).length,
      done: todos.filter((todo) => todo.completed).length,
    }),
    [todos]
  );

  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    return todos.filter((todo) => {
      if (status === "open" && todo.completed) return false;
      if (status === "done" && !todo.completed) return false;
      return matchesTodo(todo, term);
    });
  }, [todos, q, status]);

  const grouped = useMemo(() => {
    const map = new Map<string, Todo[]>();
    map.set(UNCATEGORIZED, []);
    for (const category of categories) map.set(String(category.id), []);
    for (const todo of visible) {
      const key = todo.category ? String(todo.category.id) : UNCATEGORIZED;
      const bucket = map.get(key);
      if (bucket) bucket.push(todo);
      else map.set(key, [todo]);
    }
    for (const [key, list] of map) map.set(key, sortTodos(list));
    return map;
  }, [visible, categories]);

  const setParam = (key: string, value: string | null) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true }
    );
  };

  const onMutationError = () => toast.error(t("todos.errors.action"));

  const handleToggle = (todo: Todo) => {
    updateTodo.mutate(
      { todo, input: toTodoInput(todo, { completed: !todo.completed }) },
      { onError: onMutationError }
    );
  };

  const handleMove = (todo: Todo, categoryId: number | null) => {
    const currentId = todo.category?.id ?? null;
    if (currentId === categoryId) return;
    updateTodo.mutate(
      {
        todo,
        input: toTodoInput(todo, {
          category: categoryId === null ? null : { id: categoryId },
        }),
      },
      { onError: onMutationError }
    );
  };

  const handleDrop = (columnKey: string) => {
    const todo = dragging;
    setDragging(null);
    setOverColumn(null);
    if (!todo) return;
    handleMove(todo, columnKey === UNCATEGORIZED ? null : Number(columnKey));
  };

  const openCreate = (categoryId: number | null) => {
    setEditing(null);
    setPresetCategoryId(categoryId);
    setFormOpen(true);
  };

  const openEdit = (todo: Todo) => {
    setEditing(todo);
    setPresetCategoryId(null);
    setFormOpen(true);
  };

  const openCategories = (category: TodoCategory | null) => {
    setCategoryToEdit(category);
    setCategoriesOpen(true);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteTodo.mutate(deleteTarget, {
      onError: onMutationError,
      onSettled: () => setDeleteTarget(null),
    });
  };

  const isLoading = todosQuery.isLoading || categoriesQuery.isLoading;
  const isError = todosQuery.isError || categoriesQuery.isError;
  const hasContent = todos.length > 0 || categories.length > 0;

  const retry = () => {
    void todosQuery.refetch();
    void categoriesQuery.refetch();
  };

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <PageHeader
        title={t("todos.title")}
        subtitle={t("todos.subtitle")}
        actions={
          <>
            <Button variant="outline" onClick={() => openCategories(null)}>
              <Tags className="size-4" />
              <span className="hidden sm:inline">
                {t("todos.categories.manage")}
              </span>
            </Button>
            <Button onClick={() => openCreate(null)}>
              <Plus className="size-4" />
              <span className="hidden sm:inline">{t("todos.create")}</span>
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative lg:max-w-sm lg:flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setParam("q", e.target.value)}
            placeholder={t("todos.searchPlaceholder")}
            className="pl-9"
            aria-label={t("common.search")}
          />
        </div>

        <div
          role="group"
          aria-label={t("common.filters")}
          className="flex w-full gap-1 overflow-x-auto rounded-md border border-border p-1 lg:w-auto"
        >
          {FILTERS.map((filter) => {
            const active = status === filter;
            return (
              <button
                key={filter}
                type="button"
                onClick={() =>
                  setParam("status", filter === DEFAULT_FILTER ? null : filter)
                }
                aria-pressed={active}
                className={cn(
                  "flex min-h-9 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-sm px-3 text-sm transition-colors lg:flex-none",
                  active
                    ? "bg-accent font-medium text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/60"
                )}
              >
                {t(`todos.filter.${filter}`)}
                <span className="text-xs text-muted-foreground">
                  {counts[filter]}
                </span>
              </button>
            );
          })}
        </div>

        <p className="hidden text-xs text-muted-foreground xl:block">
          {t("todos.dragHint")}
        </p>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState
          error={todosQuery.error ?? categoriesQuery.error}
          retrying={todosQuery.isFetching || categoriesQuery.isFetching}
          onRetry={retry}
        />
      ) : !hasContent ? (
        <EmptyState
          message={t("todos.empty")}
          icon={<ListChecks className="size-8" />}
        />
      ) : (
        <div className="flex min-h-0 flex-1 gap-4 overflow-x-auto pb-2">
          <TodoColumn
            category={null}
            todos={grouped.get(UNCATEGORIZED) ?? []}
            categories={categories}
            draggingId={dragging?.id ?? null}
            isOver={overColumn === UNCATEGORIZED}
            onDragEnterColumn={() => setOverColumn(UNCATEGORIZED)}
            onDragLeaveColumn={() =>
              setOverColumn((prev) => (prev === UNCATEGORIZED ? null : prev))
            }
            onDropColumn={() => handleDrop(UNCATEGORIZED)}
            onDragStart={setDragging}
            onDragEnd={() => {
              setDragging(null);
              setOverColumn(null);
            }}
            onToggle={handleToggle}
            onEdit={openEdit}
            onMove={handleMove}
            onDelete={setDeleteTarget}
            onAdd={() => openCreate(null)}
            onEditCategory={openCategories}
          />

          {categories.map((category) => {
            const key = String(category.id);
            return (
              <TodoColumn
                key={key}
                category={category}
                todos={grouped.get(key) ?? []}
                categories={categories}
                draggingId={dragging?.id ?? null}
                isOver={overColumn === key}
                onDragEnterColumn={() => setOverColumn(key)}
                onDragLeaveColumn={() =>
                  setOverColumn((prev) => (prev === key ? null : prev))
                }
                onDropColumn={() => handleDrop(key)}
                onDragStart={setDragging}
                onDragEnd={() => {
                  setDragging(null);
                  setOverColumn(null);
                }}
                onToggle={handleToggle}
                onEdit={openEdit}
                onMove={handleMove}
                onDelete={setDeleteTarget}
                onAdd={() => openCreate(category.id)}
                onEditCategory={openCategories}
              />
            );
          })}
        </div>
      )}

      <TodoFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        todo={editing}
        categories={categories}
        defaultCategoryId={presetCategoryId}
      />

      <TodoCategoriesDialog
        open={categoriesOpen}
        onOpenChange={setCategoriesOpen}
        categories={categories}
        todos={todos}
        initialEdit={categoryToEdit}
      />

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("todos.delete.title")}</DialogTitle>
            <DialogDescription>
              {t("todos.delete.confirm", {
                name: deleteTarget?.title?.trim() || t("todos.untitled"),
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteTodo.isPending}
            >
              {deleteTodo.isPending && (
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
