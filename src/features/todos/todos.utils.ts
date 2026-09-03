import type { Todo, TodoInput } from "./types";

export function toTodoInput(
  todo: Todo,
  patch: Partial<TodoInput> = {}
): TodoInput {
  return {
    title: todo.title ?? "",
    description: todo.description ?? "",
    completed: todo.completed,
    category: todo.category ? { id: todo.category.id } : null,
    ...patch,
  };
}

export function sortTodos(todos: Todo[]): Todo[] {
  return [...todos].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
  });
}

export function matchesTodo(todo: Todo, term: string): boolean {
  if (!term) return true;
  const haystack = [todo.title, todo.description, todo.category?.name]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(term);
}
