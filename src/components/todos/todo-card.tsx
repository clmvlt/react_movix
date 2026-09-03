import { useTranslation } from "react-i18next";
import { GripVertical, MoreVertical, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/date";
import { safeCategoryColor } from "@/lib/colors";
import { UNCATEGORIZED, type Todo, type TodoCategory } from "@/features/todos";

interface TodoCardProps {
  todo: Todo;
  categories: TodoCategory[];
  dragging: boolean;
  onDragStart: (todo: Todo) => void;
  onDragEnd: () => void;
  onToggle: (todo: Todo) => void;
  onEdit: (todo: Todo) => void;
  onMove: (todo: Todo, categoryId: number | null) => void;
  onDelete: (todo: Todo) => void;
}

export function TodoCard({
  todo,
  categories,
  dragging,
  onDragStart,
  onDragEnd,
  onToggle,
  onEdit,
  onMove,
  onDelete,
}: TodoCardProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? i18n.language;
  const title = todo.title?.trim() || t("todos.untitled");
  const description = todo.description?.trim();

  return (
    <article
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", String(todo.id));
        event.dataTransfer.effectAllowed = "move";
        onDragStart(todo);
      }}
      onDragEnd={onDragEnd}
      className={cn(
        "group rounded-lg border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md",
        dragging && "opacity-50"
      )}
    >
      <div className="flex items-start gap-2">
        <span
          aria-hidden="true"
          className="mt-0.5 hidden cursor-grab text-muted-foreground/60 active:cursor-grabbing sm:block"
        >
          <GripVertical className="size-4" />
        </span>

        <Checkbox
          checked={todo.completed}
          onCheckedChange={() => onToggle(todo)}
          aria-label={t("todos.form.completed")}
          className="mt-0.5 shrink-0"
        />

        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => onEdit(todo)}
            className="block w-full text-left"
          >
            <span
              className={cn(
                "block break-words text-sm font-medium text-foreground",
                todo.completed && "text-muted-foreground line-through"
              )}
            >
              {title}
            </span>
            {description && (
              <span className="mt-1 line-clamp-3 block break-words text-xs text-muted-foreground">
                {description}
              </span>
            )}
          </button>
          <p className="mt-2 text-xs text-muted-foreground/80">
            {formatDateTime(todo.createdAt, lang)}
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0"
              aria-label={t("common.actions")}
            >
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onSelect={() => onEdit(todo)}>
              <Pencil className="size-4" />
              {t("common.edit")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>{t("todos.moveTo")}</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={todo.category ? String(todo.category.id) : UNCATEGORIZED}
              onValueChange={(value) =>
                onMove(todo, value === UNCATEGORIZED ? null : Number(value))
              }
            >
              <DropdownMenuRadioItem value={UNCATEGORIZED}>
                {t("todos.uncategorized")}
              </DropdownMenuRadioItem>
              {categories.map((category) => (
                <DropdownMenuRadioItem
                  key={category.id}
                  value={String(category.id)}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="size-2.5 shrink-0 rounded-full"
                      style={{
                        backgroundColor: safeCategoryColor(category.color),
                      }}
                    />
                    <span className="truncate">
                      {category.name?.trim() || t("todos.categories.untitled")}
                    </span>
                  </span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => onDelete(todo)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="size-4" />
              {t("common.delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </article>
  );
}
