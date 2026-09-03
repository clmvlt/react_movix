import { http, type RequestOptions } from "@/lib/http";
import type { Todo, TodoCategory, TodoCategoryInput, TodoInput } from "./types";

const RESOURCE = "/api/todos";
const CATEGORIES = `${RESOURCE}/categories`;

const OPEN: RequestOptions = { auth: false };

export const todosApi = {
  list: () => http.get<Todo[]>(RESOURCE, OPEN),

  get: (id: number) => http.get<Todo>(`${RESOURCE}/${id}`, OPEN),

  create: (input: TodoInput) => http.post<Todo>(RESOURCE, input, OPEN),

  update: (id: number, input: TodoInput) =>
    http.put<Todo>(`${RESOURCE}/${id}`, input, OPEN),

  remove: (id: number) => http.delete<void>(`${RESOURCE}/${id}`, undefined, OPEN),

  listCategories: () => http.get<TodoCategory[]>(CATEGORIES, OPEN),

  createCategory: (input: TodoCategoryInput) =>
    http.post<TodoCategory>(CATEGORIES, input, OPEN),

  updateCategory: (id: number, input: TodoCategoryInput) =>
    http.put<TodoCategory>(`${CATEGORIES}/${id}`, input, OPEN),

  removeCategory: (id: number) =>
    http.delete<void>(`${CATEGORIES}/${id}`, undefined, OPEN),
};
