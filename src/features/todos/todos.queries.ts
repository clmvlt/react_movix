import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { todosApi } from "./todos.api";
import { todoKeys } from "./todos.keys";
import { toTodoInput } from "./todos.utils";
import type { Todo, TodoCategory, TodoCategoryInput, TodoInput } from "./types";

export function useTodos() {
  return useQuery({
    queryKey: todoKeys.list(),
    queryFn: () => todosApi.list(),
  });
}

export function useTodoCategories() {
  return useQuery({
    queryKey: todoKeys.categories(),
    queryFn: () => todosApi.listCategories(),
  });
}

function invalidateTodos(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: todoKeys.all });
}

async function snapshotTodos(queryClient: QueryClient) {
  await queryClient.cancelQueries({ queryKey: todoKeys.list() });
  return queryClient.getQueryData<Todo[]>(todoKeys.list());
}

function restoreTodos(queryClient: QueryClient, previous?: Todo[]) {
  if (previous) queryClient.setQueryData(todoKeys.list(), previous);
}

export function useCreateTodo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TodoInput) => todosApi.create(input),
    onSuccess: () => invalidateTodos(queryClient),
  });
}

export function useUpdateTodo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ todo, input }: { todo: Todo; input: TodoInput }) =>
      todosApi.update(todo.id, input),
    onMutate: async ({ todo, input }) => {
      const previous = await snapshotTodos(queryClient);
      const categories =
        queryClient.getQueryData<TodoCategory[]>(todoKeys.categories()) ?? [];
      const nextCategory = input.category
        ? (categories.find((c) => c.id === input.category?.id) ??
          todo.category ??
          null)
        : null;

      queryClient.setQueryData<Todo[]>(todoKeys.list(), (list) =>
        (list ?? []).map((item) =>
          item.id === todo.id
            ? {
                ...item,
                title: input.title,
                description: input.description,
                completed: input.completed,
                category: nextCategory,
              }
            : item
        )
      );
      return { previous };
    },
    onError: (_error, _variables, context) =>
      restoreTodos(queryClient, context?.previous),
    onSettled: () => invalidateTodos(queryClient),
  });
}

export function useDeleteTodo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (todo: Todo) => todosApi.remove(todo.id),
    onMutate: async (todo) => {
      const previous = await snapshotTodos(queryClient);
      queryClient.setQueryData<Todo[]>(todoKeys.list(), (list) =>
        (list ?? []).filter((item) => item.id !== todo.id)
      );
      return { previous };
    },
    onError: (_error, _variables, context) =>
      restoreTodos(queryClient, context?.previous),
    onSettled: () => invalidateTodos(queryClient),
  });
}

export function useCreateTodoCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TodoCategoryInput) => todosApi.createCategory(input),
    onSuccess: () => invalidateTodos(queryClient),
  });
}

export function useUpdateTodoCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: TodoCategoryInput }) =>
      todosApi.updateCategory(id, input),
    onSuccess: () => invalidateTodos(queryClient),
  });
}

export function useDeleteTodoCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, attached }: { id: number; attached: Todo[] }) => {
      for (const todo of attached) {
        await todosApi.update(todo.id, toTodoInput(todo, { category: null }));
      }
      await todosApi.removeCategory(id);
    },
    onSettled: () => invalidateTodos(queryClient),
  });
}
