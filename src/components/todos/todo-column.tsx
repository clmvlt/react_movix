import { useTranslation } from "react-i18next";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TodoCard } from "@/components/todos/todo-card";
import { cn } from "@/lib/utils";
import { safeCategoryColor } from "@/lib/colors";
import type { Todo, TodoCategory } from "@/features/todos";

interface TodoColumnProps {
  category: TodoCategory | null;
  todos: Todo[];
  categories: TodoCategory[];
  draggingId: number | null;
  isOver: boolean;
  onDragEnterColumn: () => void;
  onDragLeaveColumn: () => void;
  onDropColumn: () => void;
  onDragStart: (todo: Todo) => void;
  onDragEnd: () => void;
  onToggle: (todo: Todo) => void;
  onEdit: (todo: Todo) => void;
  onMove: (todo: Todo, categoryId: number | null) => void;
  onDelete: (todo: Todo) => void;
  onAdd: () => void;
  onEditCategory: (category: TodoCategory) => void;
}

export function TodoColumn({
  category,
  todos,
  categories,
  draggingId,
  isOver,
  onDragEnterColumn,
  onDragLeaveColumn,
  onDropColumn,
  onDragStart,
  onDragEnd,
  onToggle,
  onEdit,
  onMove,
  onDelete,
  onAdd,
  onEditCategory,
}: TodoColumnProps) {
  const { t } = useTranslation();
  const color = category ? safeCategoryColor(category.color) : null;
  const name = category
    ? category.name?.trim() || t("todos.categories.untitled")
    : t("todos.uncategorized");

  return (
    <section
      onDragOver={(event) => {
        if (draggingId === null) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        onDragEnterColumn();
      }}
      onDragLeave={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node)) return;
        onDragLeaveColumn();
      }}
      onDrop={(event) => {
        event.preventDefault();
        onDropColumn();
      }}
      className={cn(
        "flex min-h-64 w-72 shrink-0 flex-col rounded-xl border border-border bg-muted/40 lg:w-auto lg:min-w-72 lg:flex-1",
        isOver && "border-primary bg-accent/50 ring-2 ring-primary/30"
      )}
      aria-label={name}
    >
      <header className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <span
          aria-hidden="true"
          className={cn(
            "size-2.5 shrink-0 rounded-full",
            !color && "bg-muted-foreground/40"
          )}
          style={color ? { backgroundColor: color } : undefined}
        />
        <h2 className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
          {name}
        </h2>
        <span className="shrink-0 rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {todos.length}
        </span>
        {category && (
          <Button
            variant="ghost"
            size="icon"
            className="size-7 shrink-0"
            onClick={() => onEditCategory(category)}
            aria-label={t("todos.categories.edit")}
          >
            <Pencil className="size-3.5" />
          </Button>
        )}
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2">
        {todos.length === 0 ? (
          <p className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border px-3 py-8 text-center text-xs text-muted-foreground">
            {t("todos.columnEmpty")}
          </p>
        ) : (
          todos.map((todo) => (
            <TodoCard
              key={todo.id}
              todo={todo}
              categories={categories}
              dragging={draggingId === todo.id}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onToggle={onToggle}
              onEdit={onEdit}
              onMove={onMove}
              onDelete={onDelete}
            />
          ))
        )}
      </div>

      <div className="border-t border-border p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onAdd}
          className="w-full justify-start text-muted-foreground"
        >
          <Plus className="size-4" />
          {t("todos.addHere")}
        </Button>
      </div>
    </section>
  );
}
