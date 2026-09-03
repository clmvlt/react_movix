export type ApiDateTime = string;

export interface TodoCategory {
  id: number;
  name: string | null;
  color: string | null;
  createdAt: ApiDateTime;
}

export interface Todo {
  id: number;
  title: string | null;
  description: string | null;
  completed: boolean;
  category: TodoCategory | null;
  createdAt: ApiDateTime;
  updatedAt: ApiDateTime;
}

export interface TodoInput {
  title: string;
  description: string;
  completed: boolean;
  category: { id: number } | null;
}

export interface TodoCategoryInput {
  name: string;
  color: string;
}

export type TodoFilter = "all" | "open" | "done";

export const UNCATEGORIZED = "none";
